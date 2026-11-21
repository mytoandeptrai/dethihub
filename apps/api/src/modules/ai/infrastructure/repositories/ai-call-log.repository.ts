import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AiCallLogRepository,
  AiCallRecord,
} from '@/modules/ai/application/ports/ai-call-log.repository.port'

const DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class AiCallLogRepositoryImpl implements AiCallLogRepository {
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
        OR: [{ error: { contains: 'empty content' } }, { error: { contains: 'ngắt giữa chừng' } }],
      },
      select: { id: true },
      take: limit,
    })
    return rows.length
  }
}
