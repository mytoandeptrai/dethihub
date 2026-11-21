import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CREDIT_REPOSITORY } from '@/modules/ai/application/ports/credit.repository.port'
import { QUOTA_REPOSITORY } from '@/modules/ai/application/ports/quota.repository.port'
import { monthKey, TOKENS_PER_POINT } from '@/modules/ai/domain/quota'

import type { Env } from '@/app/config/env.schema'
import type { CreditRepositoryPort } from '@/modules/ai/application/ports/credit.repository.port'
import type { QuotaRepositoryPort } from '@/modules/ai/application/ports/quota.repository.port'
import type { Quota } from '@/modules/ai/domain/quota'
import type { Receipt } from '@/modules/ai/domain/receipt'

@Injectable()
export class QuotaService {
  constructor(
    @Inject(QUOTA_REPOSITORY) private readonly quotas: QuotaRepositoryPort,
    @Inject(CREDIT_REPOSITORY) private readonly credits: CreditRepositoryPort,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** null = unlimited. A database failure never blocks the user: usage is counted again once it can be written */
  async readQuota(userId: string): Promise<Quota | null> {
    const monthly = this.config.get('AI_MONTHLY_TOKENS', { infer: true })
    try {
      const month = monthKey()
      const [override, used, balance] = await Promise.all([
        this.quotas.findOverride(userId),
        this.quotas.findUsedTokens(userId, month),
        this.credits.findBalance(userId),
      ])
      if (override && override.monthlyTokens === null) return null

      const base = override ? Number(override.monthlyTokens) : monthly
      const credits = balance ?? (await this.credits.claimWelcome(userId, this.welcomeTokens()))
      return { used, limit: base + credits, scope: 'month', base, credits }
    } catch {
      return { used: 0, limit: Math.max(monthly, 1), scope: 'month' }
    }
  }

  async readGranted(userId: string): Promise<number> {
    try {
      return await this.credits.sumGranted(userId)
    } catch {
      return 0
    }
  }

  /** null = the user's other in-flight calls already hold the remaining quota; otherwise a release function that is safe to call repeatedly */
  async reserve(
    userId: string,
    quota: Quota,
    amount: number,
  ): Promise<(() => Promise<void>) | null> {
    const month = monthKey()
    try {
      if (!(await this.quotas.reserve(userId, month, quota.limit, amount))) return null
    } catch {
      return async () => {}
    }
    let released = false
    return async () => {
      if (released) return
      released = true
      await this.quotas.release(userId, month, amount).catch(() => {})
    }
  }

  async addUsage(userId: string, tokens: number, previous: Quota | null): Promise<Quota | null> {
    if (!previous || tokens <= 0) return previous
    const month = monthKey()
    try {
      const used = await this.quotas.addUsage(userId, month, Math.round(tokens))
      if (previous.credits && previous.base !== undefined && used > previous.base) {
        const paid = await this.credits.consume(userId, month, previous.base)
        return {
          ...previous,
          used: paid.used,
          credits: paid.balance,
          limit: previous.base + paid.balance,
        }
      }
      return { ...previous, used }
    } catch {
      return { ...previous, used: previous.used + tokens }
    }
  }

  /** Refunds at most what the retry itself cost: the retry hits the prompt cache and is cheap, a full refund would make call pairs nearly free */
  async refundReceipt(
    userId: string,
    receipt: Receipt | null,
    previous: Quota | null,
    cap: number,
  ): Promise<Quota | null> {
    if (!previous || !receipt) return previous
    const tokens = Math.min(receipt.t, Math.max(0, Math.floor(cap)))
    if (!(tokens > 0)) return previous
    try {
      const balance = await this.credits.refund(userId, receipt.m, receipt.n, tokens)
      return balance === null ? previous : await this.readQuota(userId)
    } catch {
      return previous
    }
  }

  async listCreditEvents(userId: string, limit: number) {
    return this.credits.listEvents(userId, limit)
  }

  private welcomeTokens(): number {
    return this.config.get('AI_WELCOME_POINTS', { infer: true }) * TOKENS_PER_POINT
  }
}
