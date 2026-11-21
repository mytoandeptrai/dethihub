import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { UserDataRepositoryPort } from '@/modules/exam/application/ports/user-data.repository.port'

@Injectable()
export class UserDataRepositoryImpl implements UserDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the ids of the exams the user owned so their cached rows can be dropped */
  async purge(userId: string): Promise<string[]> {
    return this.prisma.$transaction(async (tx) => {
      const owned = await tx.communityExam.findMany({
        where: { ownerId: userId },
        select: { id: true },
      })
      await tx.communityExam.updateMany({ where: { ownerId: userId }, data: { ownerId: null } })
      await tx.examAttempt.updateMany({ where: { userId }, data: { userId: null } })
      await tx.report.updateMany({ where: { reporterId: userId }, data: { reporterId: null } })
      await tx.report.updateMany({ where: { resolvedBy: userId }, data: { resolvedBy: null } })
      await tx.examAttemptLock.deleteMany({ where: { userId } })
      return owned.map((exam) => exam.id)
    })
  }
}
