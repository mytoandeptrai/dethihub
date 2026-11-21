import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PROVIDER_SETTINGS_REPOSITORY } from '@/modules/ai/application/ports/provider-settings.repository.port'
import { assertAllowedUrl, isAllowedEndpoint } from '@/modules/ai/domain/endpoint'
import { decryptKey } from '@/modules/ai/domain/settings-crypto'

import type { Env } from '@/app/config/env.schema'
import type {
  ProviderSettingRow,
  ProviderSettingsRepositoryPort,
} from '@/modules/ai/application/ports/provider-settings.repository.port'
import type {
  ProviderConfig,
  ProviderName,
  ProviderSettings,
} from '@/modules/ai/domain/provider-chain'

interface Override {
  model?: string
  baseUrl?: string
  apiKey?: string
}

const CACHE_MS = 30_000

const DEFAULTS: Record<ProviderName, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash' },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3-flash-preview',
  },
  opencode: { baseUrl: 'https://opencode.ai/inference/go/openai/v1', model: 'deepseek-v4.1-flash' },
  fosta: { baseUrl: 'https://codex.fosta.app/v1', model: 'gpt-6-luna' },
  anyrouter: { baseUrl: 'https://anyrouter.dev/v1', model: 'openai/gpt-6.1-terra' },
  nightrouter: { baseUrl: 'https://api.nightrouter.ai/v1', model: 'deepseek-v4-flash-0731' },
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-opus-5-5' },
}

/** Provider settings: environment, overlaid by what an admin saved (keys decrypted, endpoints limited to an allow-list) */
@Injectable()
export class ProviderConfigService {
  #overrides: { value: Record<string, Override>; until: number } | null = null

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(PROVIDER_SETTINGS_REPOSITORY) private readonly settings: ProviderSettingsRepositoryPort,
  ) {}

  /** Providers without a key are left out. Throws when an environment base URL is unsafe */
  async load(): Promise<ProviderConfig> {
    const overrides = await this.#readOverrides()
    const providers: ProviderConfig['providers'] = {}

    for (const name of Object.keys(DEFAULTS) as ProviderName[]) {
      const base = this.#fromEnv(name)
      const override = overrides[name]
      const merged: ProviderSettings = {
        apiKey: override?.apiKey || base.apiKey,
        baseUrl: override?.baseUrl || base.baseUrl,
        model: override?.model || base.model,
      }
      if (merged.apiKey) providers[name] = merged
    }

    return {
      providers,
      opencodeFallbackModel: this.config.get('LLM_FALLBACK_MODEL', { infer: true }),
      deepseekStrongModel: this.config.get('DEEPSEEK_STRONG_MODEL', { infer: true }),
    }
  }

  #fromEnv(name: ProviderName): ProviderSettings {
    const key = name === 'opencode' ? 'LLM' : name.toUpperCase()
    const env = (suffix: string) =>
      this.config.get(`${key}_${suffix}` as keyof Env, { infer: true }) as string | undefined
    const baseUrl = (env('BASE_URL') ?? DEFAULTS[name].baseUrl).replace(/\/+$/, '')
    return {
      apiKey: env('API_KEY') ?? '',
      baseUrl: assertAllowedUrl(baseUrl, `${key}_BASE_URL`).toString().replace(/\/+$/, ''),
      model: env('MODEL') ?? DEFAULTS[name].model,
    }
  }

  /** Kept 30 s in memory (never in the shared cache: the values hold API keys); a failed read keeps the last good value */
  async #readOverrides(): Promise<Record<string, Override>> {
    if (this.#overrides && this.#overrides.until > Date.now()) return this.#overrides.value
    let value = this.#overrides?.value ?? {}
    try {
      const rows = await this.settings.findAll()
      value = Object.fromEntries(rows.map((row) => [row.provider, this.#toOverride(row)]))
    } catch {
      // keep the last value
    }
    this.#overrides = { value, until: Date.now() + CACHE_MS }
    return value
  }

  /** A custom endpoint is used only together with its own decrypted key, so the environment key is never sent to an admin-entered host */
  #toOverride(row: ProviderSettingRow): Override {
    const model = row.model ?? undefined
    const allowedHosts = this.config.get('AI_ENDPOINT_ALLOWED_HOSTS', { infer: true }) ?? ''
    if (row.baseUrl && !isAllowedEndpoint(row.baseUrl, allowedHosts)) return { model }

    const secret = this.config.get('AI_SETTINGS_SECRET', { infer: true }) ?? ''
    const apiKey = row.apiKeyEnc ? (decryptKey(secret, row.apiKeyEnc) ?? undefined) : undefined
    return { model, apiKey, baseUrl: apiKey ? (row.baseUrl ?? undefined) : undefined }
  }
}
