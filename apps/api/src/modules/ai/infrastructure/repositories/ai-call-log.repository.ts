import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AiCallErrorRow,
  AiCallLogRepositoryPort,
  AiCallRecord,
  AiCallStatsRow,
} from '@/modules/ai/application/ports/ai-call-log.repository.port'

const DAY_MS = 24 * 60 * 60 * 1000
const FREE_FAIL_FILTER = [
  { error: { contains: 'empty content' } },
  { error: { contains: 'ngắt giữa chừng' } },
]

interface StatsRow {
  day: string
  model: string
  provider: string
  calls: number
  errors: number
  tokens: bigint
  cost: number | null
  avg_ms: number
}

@Injectable()
export class AiCallLogRepositoryImpl implements AiCallLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async log(call: AiCallRecord): Promise<void> {
    await this.prisma.aiCall.create({
      data: {
        userId: call.userId,
        model: call.model.slice(0, 120),
        provider: call.provider.slice(0, 40),
        ok: call.ok,
        error: call.error?.slice(0, 500) ?? null,
        promptTokens: Math.max(0, Math.round(call.promptTokens)),
        completionTokens: Math.max(0, Math.round(call.completionTokens)),
        cost: call.cost,
        ms: Math.max(0, Math.round(call.ms)),
      },
    })
  }

  async countRecentFreeFails(userId: string, limit: number): Promise<number> {
    const rows = await this.prisma.aiCall.findMany({
      where: {
        userId,
        ok: false,
        createdAt: { gte: new Date(Date.now() - DAY_MS) },
        OR: FREE_FAIL_FILTER,
      },
      select: { id: true },
      take: limit,
    })
    return rows.length
  }

  async countRecentFreeFailsByUser(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map()
    const groups = await this.prisma.aiCall.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        ok: false,
        createdAt: { gte: new Date(Date.now() - DAY_MS) },
        OR: FREE_FAIL_FILTER,
      },
      _count: { _all: true },
    })
    return new Map(groups.flatMap((group) => (group.userId ? [[group.userId, group._count._all]] : [])))
  }

  async stats(days: number): Promise<AiCallStatsRow[]> {
    const rows = await this.prisma.$queryRaw<StatsRow[]>`
      SELECT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day, model, provider,
        count(*)::int AS calls,
        (count(*) FILTER (WHERE NOT ok))::int AS errors,
        coalesce(sum(prompt_tokens + completion_tokens), 0)::bigint AS tokens,
        sum(cost)::float8 AS cost,
        coalesce(avg(ms), 0)::int AS avg_ms
      FROM ai_calls
      WHERE created_at >= now() - make_interval(days => ${days}::int)
      GROUP BY 1, 2, 3
      ORDER BY 1 DESC, 4 DESC`
    return rows.map((row) => ({
      day: row.day,
      model: row.model,
      provider: row.provider,
      calls: row.calls,
      errors: row.errors,
      tokens: Number(row.tokens),
      cost: row.cost,
      avgMs: row.avg_ms,
    }))
  }

  async listErrors(limit: number): Promise<AiCallErrorRow[]> {
    const rows = await this.prisma.aiCall.findMany({
      where: { ok: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map((row) => ({
      id: Number(row.id),
      userId: row.userId,
      model: row.model,
      provider: row.provider,
      error: row.error,
      ms: row.ms,
      createdAt: row.createdAt,
    }))
  }
}
