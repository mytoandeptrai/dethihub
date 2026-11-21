import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  QuotaOverride,
  QuotaRepository,
} from '@/modules/ai/application/ports/quota.repository.port'

const STALE_RESERVATION_MS = 6 * 60 * 1000

@Injectable()
export class QuotaRepositoryImpl implements QuotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOverride(userId: string): Promise<QuotaOverride | null> {
    const row = await this.prisma.aiQuotaOverride.findUnique({ where: { userId } })
    if (!row) return null
    return { monthlyTokens: row.monthlyTokens === null ? null : Number(row.monthlyTokens) }
  }

  async findUsedTokens(userId: string, month: string): Promise<number> {
    const row = await this.prisma.aiUsage.findUnique({ where: { userId_month: { userId, month } } })
    return Number(row?.tokens ?? 0)
  }

  async reserve(userId: string, month: string, limit: number, amount: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO ai_usage (user_id, month) VALUES (${userId}::uuid, ${month}) ON CONFLICT (user_id, month) DO NOTHING`
      const [row] = await tx.$queryRaw<
        { tokens: bigint; reserved: bigint; reserved_at: Date | null }[]
      >`SELECT tokens, reserved, reserved_at FROM ai_usage WHERE user_id = ${userId}::uuid AND month = ${month} FOR UPDATE`
      if (!row) return false

      // A reservation older than 6 minutes belongs to a call that died without releasing
      const stale =
        !row.reserved_at || row.reserved_at.getTime() < Date.now() - STALE_RESERVATION_MS
      const held = stale ? 0 : Number(row.reserved)
      if (Number(row.tokens) + held >= limit) return false

      await tx.aiUsage.update({
        where: { userId_month: { userId, month } },
        data: { reserved: held + Math.max(amount, 0), reservedAt: new Date() },
      })
      return true
    })
  }

  async release(userId: string, month: string, amount: number): Promise<void> {
    await this.prisma
      .$executeRaw`UPDATE ai_usage SET reserved = GREATEST(reserved - ${Math.max(amount, 0)}::bigint, 0) WHERE user_id = ${userId}::uuid AND month = ${month}`
  }

  async addUsage(userId: string, month: string, tokens: number): Promise<number> {
    const [row] = await this.prisma.$queryRaw<{ tokens: bigint }[]>`
      INSERT INTO ai_usage (user_id, month, tokens, requests)
      VALUES (${userId}::uuid, ${month}, ${Math.max(tokens, 0)}::bigint, 1)
      ON CONFLICT (user_id, month) DO UPDATE
        SET tokens = ai_usage.tokens + EXCLUDED.tokens,
            requests = ai_usage.requests + 1,
            updated_at = now()
      RETURNING tokens`
    return Number(row?.tokens ?? 0)
  }
}
