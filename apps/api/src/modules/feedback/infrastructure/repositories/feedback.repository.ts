import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  FeedbackRecord,
  FeedbackRepositoryPort,
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

@Injectable()
export class FeedbackRepositoryImpl implements FeedbackRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

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
