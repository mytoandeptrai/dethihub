import { Injectable } from '@nestjs/common'
import { Prisma } from '@workspace/database'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AttemptRepositoryPort,
  AttemptRow,
  NewAttempt,
} from '@/modules/exam/application/ports/attempt.repository.port'

const toData = (attempt: NewAttempt): Prisma.ExamAttemptUncheckedCreateInput => ({
  examId: attempt.examId,
  userId: attempt.userId,
  studentName: attempt.studentName,
  score: attempt.score,
  maxScore: attempt.maxScore,
  durationSeconds: attempt.durationSeconds,
  deviceId: attempt.deviceId,
  className: attempt.className,
  seatNo: attempt.seatNo,
})

@Injectable()
export class AttemptRepositoryImpl implements AttemptRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async hasAttempted(
    examId: string,
    userId: string | null,
    deviceId: string | null,
  ): Promise<boolean> {
    const byLock = userId
      ? await this.prisma.examAttemptLock.findUnique({
          where: { examId_userId: { examId, userId } },
          select: { examId: true },
        })
      : null
    if (byLock) return true
    if (!deviceId) return false
    const byDevice = await this.prisma.examAttempt.findFirst({
      where: { examId, deviceId },
      select: { id: true },
    })
    return byDevice !== null
  }

  async insert(attempt: NewAttempt): Promise<void> {
    await this.prisma.examAttempt.create({ data: toData(attempt) })
  }

  async insertWithLock(attempt: NewAttempt & { userId: string }): Promise<'saved' | 'duplicate'> {
    try {
      await this.prisma.$transaction([
        this.prisma.examAttemptLock.create({
          data: { examId: attempt.examId, userId: attempt.userId },
        }),
        this.prisma.examAttempt.create({ data: toData(attempt) }),
      ])
      return 'saved'
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'duplicate'
      }
      throw error
    }
  }

  countByUser(examId: string, userId: string): Promise<number> {
    return this.prisma.examAttempt.count({ where: { examId, userId } })
  }

  countByGuestDevice(examId: string, deviceId: string): Promise<number> {
    return this.prisma.examAttempt.count({ where: { examId, userId: null, deviceId } })
  }

  countGuests(examId: string): Promise<number> {
    return this.prisma.examAttempt.count({ where: { examId, userId: null } })
  }

  listForExams(examIds: string[], limit: number, afterId?: string): Promise<AttemptRow[]> {
    return this.prisma.examAttempt.findMany({
      where: { examId: { in: examIds } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(afterId && { cursor: { id: afterId }, skip: 1 }),
      select: {
        id: true,
        examId: true,
        userId: true,
        studentName: true,
        score: true,
        maxScore: true,
        durationSeconds: true,
        createdAt: true,
        deviceId: true,
        className: true,
        seatNo: true,
      },
    })
  }
}
