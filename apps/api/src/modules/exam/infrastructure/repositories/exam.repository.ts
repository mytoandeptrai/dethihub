import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { PublishedExam } from '@/modules/exam/domain/aggregates/published-exam.aggregate'
import { ExamSummary } from '@/modules/exam/domain/value-objects/exam-summary.vo'
import { ModerationState } from '@/modules/exam/domain/value-objects/moderation-state.vo'

import type {
  ExamCard,
  ExamRepositoryPort,
  PublishedRow,
} from '@/modules/exam/application/ports/exam.repository.port'
import type { ExamStatus } from '@/modules/exam/domain/enums/exam-status.enum'
import type { ExamDoc } from '@workspace/core'
import type { CommunityExam, Prisma } from '@workspace/database'

const CARD_SELECT = {
  id: true,
  ownerId: true,
  title: true,
  subject: true,
  grade: true,
  school: true,
  createdAt: true,
  questionCount: true,
  durationMinutes: true,
  totalPoints: true,
  preview: true,
  listed: true,
  missingKeys: true,
} satisfies Prisma.CommunityExamSelect

@Injectable()
export class ExamRepositoryImpl implements ExamRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedRow(id: string): Promise<PublishedRow | null> {
    const row = await this.prisma.communityExam.findFirst({
      where: { id, status: 'published' },
      select: { doc: true, listed: true },
    })
    return row ? { doc: row.doc as unknown as ExamDoc, listed: row.listed } : null
  }

  async findCommunityDoc(id: string): Promise<ExamDoc | null> {
    const row = await this.prisma.communityExam.findFirst({
      where: { id, listed: true, status: 'published' },
      select: { doc: true },
    })
    return row ? (row.doc as unknown as ExamDoc) : null
  }

  async findById(id: string): Promise<PublishedExam | null> {
    const row = await this.prisma.communityExam.findUnique({ where: { id } })
    return row ? toDomain(row) : null
  }

  async save(exam: PublishedExam): Promise<void> {
    const { summary } = exam
    const data = {
      title: summary.title,
      subject: summary.subject,
      grade: summary.grade,
      school: summary.school,
      doc: exam.doc as unknown as Prisma.InputJsonValue,
      questionCount: summary.questionCount,
      durationMinutes: summary.durationMinutes,
      totalPoints: summary.totalPoints,
      preview: summary.preview,
      listed: exam.listed,
      missingKeys: summary.missingKeys,
    }
    await this.prisma.communityExam.upsert({
      where: { id: exam.id },
      create: { id: exam.id, ownerId: exam.ownerId, createdAt: exam.createdAt, ...data },
      update: data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.communityExam.deleteMany({ where: { id } })
  }

  listCommunity(limit: number): Promise<ExamCard[]> {
    return this.prisma.communityExam.findMany({
      where: { listed: true, status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: CARD_SELECT,
    })
  }

  listByOwner(ownerId: string, limit: number, offset: number): Promise<ExamCard[]> {
    return this.prisma.communityExam.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: CARD_SELECT,
    })
  }

  countByOwner(ownerId: string): Promise<number> {
    return this.prisma.communityExam.count({ where: { ownerId } })
  }

  async filterCommunityAuthors(ownerIds: string[]): Promise<string[]> {
    const rows = await this.prisma.communityExam.findMany({
      where: { ownerId: { in: ownerIds }, listed: true, status: 'published' },
      distinct: ['ownerId'],
      select: { ownerId: true },
    })
    return rows.flatMap((row) => (row.ownerId ? [row.ownerId] : []))
  }

  async findOwnedIds(ownerId: string, examIds: string[]): Promise<string[]> {
    const rows = await this.prisma.communityExam.findMany({
      where: { ownerId, id: { in: examIds } },
      select: { id: true },
    })
    return rows.map((row) => row.id)
  }
}

function toDomain(row: CommunityExam): PublishedExam {
  return PublishedExam.reconstitute({
    id: row.id,
    ownerId: row.ownerId,
    doc: row.doc as unknown as ExamDoc,
    listed: row.listed,
    status: row.status as ExamStatus,
    summary: ExamSummary.restore({
      title: row.title,
      subject: row.subject,
      grade: row.grade,
      school: row.school,
      questionCount: row.questionCount,
      durationMinutes: row.durationMinutes,
      totalPoints: row.totalPoints,
      preview: row.preview,
      missingKeys: row.missingKeys ?? 0,
    }),
    moderation: ModerationState.restore({
      removedReason: row.removedReason,
      moderatedBy: row.moderatedBy,
      moderatedAt: row.moderatedAt,
    }),
    createdAt: row.createdAt,
  })
}
