import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  FeedbackRecord,
  FeedbackRepositoryPort,
  NewFeedback,
  SubmitOutcome,
} from '@/modules/feedback/application/ports/feedback.repository.port'

const toRecord = (row: {
  id: bigint
  userId: string | null
  email: string | null
  message: string
  page: string | null
  createdAt: Date
  read: boolean
}): FeedbackRecord => ({
  id: row.id.toString(),
  userId: row.userId,
  email: row.email,
  message: row.message,
  page: row.page,
  createdAt: row.createdAt,
  read: row.read,
})

const HOUR_MS = 60 * 60 * 1000

@Injectable()
export class FeedbackRepositoryImpl implements FeedbackRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async insertWithinLimit(
    feedback: NewFeedback,
    userPerHour: number,
    guestPerHour: number,
  ): Promise<SubmitOutcome> {
    return this.prisma.$transaction(async (tx) => {
      // Guests share one lock and one budget, each user has their own. A held lock means a send is
      // already in flight: refuse instead of queueing, a burst must not hold the connection pool
      const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtext(${'feedback:' + (feedback.userId ?? 'anon')})) AS locked`
      if (!lock?.locked) return 'busy'
      const since = new Date(Date.now() - HOUR_MS)
      const recent = await tx.feedback.count({
        where: { userId: feedback.userId, createdAt: { gt: since } },
      })
      if (recent >= (feedback.userId ? userPerHour : guestPerHour)) {
        return feedback.userId ? 'user-limit' : 'guest-limit'
      }
      await tx.feedback.create({ data: feedback })
      return 'ok'
    })
  }

  async list(
    page: number,
    perPage: number,
    read: boolean | undefined,
  ): Promise<{ rows: FeedbackRecord[]; total: number }> {
    const where = read === undefined ? {} : { read }
    const [rows, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.feedback.count({ where }),
    ])
    return { rows: rows.map((row) => toRecord(row)), total }
  }

  async setRead(id: bigint, read: boolean): Promise<void> {
    await this.prisma.feedback.updateMany({ where: { id }, data: { read } })
  }
}
