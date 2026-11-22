import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AI_CALL_LOG_REPOSITORY } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import { CREDIT_REPOSITORY } from '@/modules/ai/application/ports/credit.repository.port'
import {
  ANTHROPIC_PROVIDER,
  OPENAI_COMPATIBLE_PROVIDER,
} from '@/modules/ai/application/ports/llm-provider.port'
import { PROVIDER_SETTINGS_REPOSITORY } from '@/modules/ai/application/ports/provider-settings.repository.port'
import { QUOTA_REPOSITORY } from '@/modules/ai/application/ports/quota.repository.port'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import { WelcomePointsService } from '@/modules/ai/application/services/welcome-points.service'
import { EMPTY_FREE_PER_DAY } from '@/modules/ai/domain/billing'
import { assertAllowedUrl, isAllowedEndpoint } from '@/modules/ai/domain/endpoint'
import { LlmUpstreamError } from '@/modules/ai/domain/provider-chain'
import { monthKey } from '@/modules/ai/domain/quota'
import { encryptKey, MIN_SETTINGS_SECRET_LENGTH } from '@/modules/ai/domain/settings-crypto'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'
import { assertSafeEndpoint } from '@/shared-kernel/infrastructure/net/safe-url'

import type { Env } from '@/app/config/env.schema'
import type {
  AiCallErrorRow,
  AiCallLogRepositoryPort,
  AiCallStatsRow,
} from '@/modules/ai/application/ports/ai-call-log.repository.port'
import type { CreditRepositoryPort } from '@/modules/ai/application/ports/credit.repository.port'
import type { LlmProviderPort } from '@/modules/ai/application/ports/llm-provider.port'
import type { ProviderSettingsRepositoryPort } from '@/modules/ai/application/ports/provider-settings.repository.port'
import type { QuotaRepositoryPort } from '@/modules/ai/application/ports/quota.repository.port'
import type { ProviderView } from '@/modules/ai/application/services/provider-config.service'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { UserProfileLookupPort } from '@/shared-kernel/application/ports/user-profile-lookup.port'

const MODEL_NAME = /^[\w.:/-]+$/
const PRINTABLE = /^[!-~]+$/
const PING_PROMPT = 'Trả lời đúng một chữ: OK'
const PING_TIMEOUT_MS = 30_000

export interface UserQuotaView {
  override: { monthlyTokens: number | null; note: string } | null
  defaultLimit: number
  usedThisMonth: number
  requestsThisMonth: number
  credits: number
  welcomePending: boolean
  emptyDay: number
  freeEmpty: number
}

export interface ErrorView extends AiCallErrorRow {
  userName: string
  userEmail: string
  emptyDay: number
}

export interface ProviderInput {
  model: string
  endpoint: string
  apiKey: string
}

const bad = (message: string) => new BadRequestException({ code: ErrorCode.BAD_REQUEST, message })

@Injectable()
export class AiAdminService {
  constructor(
    @Inject(QUOTA_REPOSITORY) private readonly quotas: QuotaRepositoryPort,
    @Inject(CREDIT_REPOSITORY) private readonly credits: CreditRepositoryPort,
    @Inject(AI_CALL_LOG_REPOSITORY) private readonly calls: AiCallLogRepositoryPort,
    @Inject(PROVIDER_SETTINGS_REPOSITORY) private readonly settings: ProviderSettingsRepositoryPort,
    @Inject(OPENAI_COMPATIBLE_PROVIDER) private readonly openAiCompatible: LlmProviderPort,
    @Inject(ANTHROPIC_PROVIDER) private readonly anthropic: LlmProviderPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    @Inject(USER_PROFILE_LOOKUP) private readonly profiles: UserProfileLookupPort,
    private readonly providers: ProviderConfigService,
    private readonly config: ConfigService<Env, true>,
    private readonly welcome: WelcomePointsService,
  ) {}

  async getQuota(userId: string): Promise<UserQuotaView> {
    const month = monthKey()
    const [override, used, requests, balance, emptyDay] = await Promise.all([
      this.quotas.findOverride(userId),
      this.quotas.findUsedTokens(userId, month),
      this.quotas.findRequests(userId, month),
      this.credits.findBalance(userId),
      this.calls.countRecentFreeFails(userId, 100).catch(() => 0),
    ])
    return {
      override: override
        ? { monthlyTokens: override.monthlyTokens, note: override.note ?? '' }
        : null,
      defaultLimit: this.config.get('AI_MONTHLY_TOKENS', { infer: true }),
      usedThisMonth: used,
      requestsThisMonth: requests,
      // No balance row yet: the welcome gift arrives with the first call, show that instead of 0
      credits: balance ?? (await this.welcome.tokens()),
      welcomePending: balance === null,
      emptyDay,
      freeEmpty: EMPTY_FREE_PER_DAY,
    }
  }

  async setQuota(adminId: string, userId: string, monthlyTokens: number | null, note: string) {
    await this.quotas.upsertOverride(userId, monthlyTokens, note || null)
    await this.audit.record(adminId, 'quota.set', userId, { monthlyTokens, note })
  }

  async clearQuota(adminId: string, userId: string) {
    await this.quotas.deleteOverride(userId)
    await this.audit.record(adminId, 'quota.clear', userId)
  }

  async grantCredits(
    adminId: string,
    userId: string,
    tokens: number,
    note: string,
  ): Promise<number> {
    // Without a balance row the manual grant would create it and the user would lose the welcome gift
    if ((await this.credits.findBalance(userId)) === null) {
      await this.credits.claimWelcome(userId, await this.welcome.tokens())
    }
    const balance = await this.credits.grant(userId, tokens, 'admin')
    await this.audit.record(adminId, 'credits.grant', userId, { tokens, balance, note })
    return balance
  }

  stats(days: number): Promise<AiCallStatsRow[]> {
    return this.calls.stats(days)
  }

  async errors(limit: number): Promise<ErrorView[]> {
    const rows = await this.calls.listErrors(limit)
    const ids = [...new Set(rows.flatMap((row) => (row.userId ? [row.userId] : [])))]
    const [contacts, emptyCounts] = await Promise.all([
      this.profiles.getContacts(ids).catch(() => new Map()),
      this.calls.countRecentFreeFailsByUser(ids).catch(() => new Map<string, number>()),
    ])
    return rows.map((row) => {
      const contact = row.userId ? contacts.get(row.userId) : undefined
      return {
        id: row.id,
        userId: row.userId,
        model: row.model,
        provider: row.provider,
        error: row.error,
        ms: row.ms,
        createdAt: row.createdAt,
        userName: contact?.name ?? '',
        userEmail: contact?.email ?? '',
        emptyDay: row.userId ? (emptyCounts.get(row.userId) ?? 0) : 0,
      }
    })
  }

  listProviders(): Promise<ProviderView[]> {
    return this.providers.describe()
  }

  async saveProvider(
    adminId: string,
    provider: string,
    input: ProviderInput,
  ): Promise<ProviderView[]> {
    const current = await this.#find(provider)
    const endpoint = input.endpoint.replace(/\/+$/, '')
    if (input.model && !MODEL_NAME.test(input.model)) throw bad('Tên model không hợp lệ.')
    if (input.apiKey && !PRINTABLE.test(input.apiKey)) throw bad('API key không hợp lệ.')
    const secret = this.config.get('AI_SETTINGS_SECRET', { infer: true }) ?? ''
    if (input.apiKey && secret.length < MIN_SETTINGS_SECRET_LENGTH) {
      throw bad(
        `Server chưa đặt AI_SETTINGS_SECRET (tối thiểu ${MIN_SETTINGS_SECRET_LENGTH} ký tự) nên chưa lưu được API key.`,
      )
    }

    const next = endpoint || current.defaultEndpoint
    const changed = next !== current.endpoint
    // Keeping the old key after an endpoint change would send it to the new host
    if (changed && !input.apiKey) throw bad('Đổi endpoint thì phải nhập lại API key.')
    const custom = next !== current.defaultEndpoint
    if (changed && custom) {
      const allowed = this.config.get('AI_ENDPOINT_ALLOWED_HOSTS', { infer: true }) ?? ''
      if (!isAllowedEndpoint(next, allowed)) {
        throw bad(
          'Tên miền này chưa được cho phép. Thêm vào AI_ENDPOINT_ALLOWED_HOSTS rồi lưu lại.',
        )
      }
      try {
        assertAllowedUrl(next, 'Endpoint')
        await assertSafeEndpoint(next)
      } catch (error) {
        throw bad(error instanceof Error ? error.message : 'Endpoint không hợp lệ.')
      }
    }

    const stored = await this.settings.find(provider)
    const model = input.model && input.model !== current.defaultModel ? input.model : null
    await this.settings.upsert({
      provider,
      model,
      baseUrl: custom ? next : null,
      apiKeyEnc: input.apiKey ? encryptKey(secret, input.apiKey) : (stored?.apiKeyEnc ?? null),
    })
    this.providers.invalidate()
    await this.audit.record(adminId, 'ai.saveProvider', provider, {
      from: current.model,
      model: model ?? current.defaultModel,
      endpoint: next,
      keyChanged: Boolean(input.apiKey),
    })
    return this.providers.describe()
  }

  async resetProvider(adminId: string, provider: string): Promise<ProviderView[]> {
    await this.#find(provider)
    await this.settings.delete(provider)
    this.providers.invalidate()
    await this.audit.record(adminId, 'ai.resetProvider', provider)
    return this.providers.describe()
  }

  async ping(
    provider: string,
  ): Promise<{ provider: string; model: string; ok: boolean; ms: number; error?: string }> {
    const view = await this.#find(provider)
    const settings = (await this.providers.load()).providers[view.provider]
    if (!settings)
      return { provider, model: view.model, ok: false, ms: 0, error: 'Chưa có API key.' }

    const start = Date.now()
    try {
      const adapter = view.provider === 'anthropic' ? this.anthropic : this.openAiCompatible
      await adapter.complete({
        target: { provider: view.provider, ...settings },
        messages: [{ role: 'user', content: PING_PROMPT }],
        maxTokens: 64,
        timeoutMs: PING_TIMEOUT_MS,
      })
      return { provider, model: settings.model, ok: true, ms: Date.now() - start }
    } catch (error) {
      const reason = error instanceof LlmUpstreamError ? `HTTP ${error.status}` : String(error)
      return { provider, model: settings.model, ok: false, ms: Date.now() - start, error: reason }
    }
  }

  async #find(provider: string): Promise<ProviderView> {
    const view = (await this.providers.describe()).find((item) => item.provider === provider)
    if (!view) throw bad('Provider không hợp lệ.')
    return view
  }
}
