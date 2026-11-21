import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  NewReport,
  ReportRepositoryPort,
} from '@/modules/exam/application/ports/report.repository.port'

const DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class ReportRepositoryImpl implements ReportRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(report: NewReport, dailyLimit: number): Promise<'created' | 'duplicate' | 'limit'> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reports:${report.reporterId}`}))`
      const open = await tx.report.count({
        where: { examId: report.examId, reporterId: report.reporterId, status: 'open' },
      })
      if (open > 0) return 'duplicate'
      const today = await tx.report.count({
        where: {
          reporterId: report.reporterId,
          createdAt: { gt: new Date(Date.now() - DAY_MS) },
        },
      })
      if (today >= dailyLimit) return 'limit'
      await tx.report.create({ data: report })
      return 'created'
    })
  }

  async hasOpen(examId: string): Promise<boolean> {
    const open = await this.prisma.report.count({ where: { examId, status: 'open' } })
    return open > 0
  }
}
