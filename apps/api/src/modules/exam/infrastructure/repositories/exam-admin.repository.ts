import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AdminExamDetail,
  AdminExamRow,
  AdminReportRow,
  ExamAdminRepositoryPort,
  ExamFilter,
  ExamScope,
  ReportTarget,
  StatusChange,
} from '@/modules/exam/application/ports/exam-admin.repository.port'
import type { CommunityExam, Prisma } from '@workspace/database'

const scopeWhere = (scope: ExamScope): Prisma.CommunityExamWhereInput =>
  scope.listedOnly ? { listed: true } : {}

function toRow(exam: Omit<CommunityExam, 'doc'>, openReports: number): AdminExamRow {
  return {
    id: exam.id,
    ownerId: exam.ownerId,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    school: exam.school,
    createdAt: exam.createdAt,
    questionCount: exam.questionCount,
    durationMinutes: exam.durationMinutes,
    totalPoints: exam.totalPoints,
    preview: exam.preview,
    listed: exam.listed,
    status: exam.status,
    removedReason: exam.removedReason,
    moderatedBy: exam.moderatedBy,
    moderatedAt: exam.moderatedAt,
    missingKeys: exam.missingKeys,
    openReports,
  }
}

@Injectable()
export class ExamAdminRepositoryImpl implements ExamAdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: ExamScope,
    filter: ExamFilter,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminExamRow[]; total: number }> {
    const where: Prisma.CommunityExamWhereInput = {
      ...scopeWhere(scope),
      ...(filter.q && { title: { contains: filter.q, mode: 'insensitive' } }),
      ...(filter.status && { status: filter.status }),
      ...(filter.subject && { subject: filter.subject }),
    }
    const [exams, total] = await Promise.all([
      this.prisma.communityExam.findMany({
        where,
        omit: { doc: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.communityExam.count({ where }),
    ])
    const open = await this.prisma.report.groupBy({
      by: ['examId'],
      where: { status: 'open', examId: { in: exams.map((exam) => exam.id) } },
      _count: { _all: true },
    })
    const counts = new Map(open.map((group) => [group.examId, group._count._all]))
    return { rows: exams.map((exam) => toRow(exam, counts.get(exam.id) ?? 0)), total }
  }

  async find(scope: ExamScope, id: string): Promise<AdminExamDetail | null> {
    const exam = await this.prisma.communityExam.findFirst({ where: { id, ...scopeWhere(scope) } })
    if (!exam) return null
    const openReports = await this.prisma.report.count({ where: { examId: id, status: 'open' } })
    return { ...toRow(exam, openReports), doc: exam.doc }
  }

  async changeStatus(id: string, change: StatusChange): Promise<boolean> {
    const { count } = await this.prisma.communityExam.updateMany({
      where: { id, status: change.from },
      data: {
        status: change.status,
        removedReason: change.reason,
        moderatedBy: change.moderatorId,
        moderatedAt: new Date(),
      },
    })
    return count > 0
  }

  async delete(id: string): Promise<string | null> {
    const exam = await this.prisma.communityExam.findUnique({
      where: { id },
      select: { title: true },
    })
    if (!exam) return null
    await this.prisma.communityExam.deleteMany({ where: { id } })
    return exam.title
  }

  async listReports(
    scope: ExamScope,
    status: string,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminReportRow[]; total: number }> {
    const where: Prisma.ReportWhereInput = {
      ...(status && { status }),
      ...(scope.listedOnly && { exam: { listed: true } }),
    }
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: { exam: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.report.count({ where }),
    ])
    return {
      rows: reports.map((report) => ({
        id: report.id.toString(),
        examId: report.examId,
        examTitle: report.exam.title,
        reporterId: report.reporterId,
        reason: report.reason,
        detail: report.detail,
        status: report.status,
        createdAt: report.createdAt,
        resolvedBy: report.resolvedBy,
        resolvedAt: report.resolvedAt,
      })),
      total,
    }
  }

  async findReportTarget(scope: ExamScope, reportId: bigint): Promise<ReportTarget | null> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, ...(scope.listedOnly && { exam: { listed: true } }) },
      select: { id: true, examId: true, exam: { select: { ownerId: true } } },
    })
    return report
      ? { id: report.id.toString(), examId: report.examId, examOwnerId: report.exam.ownerId }
      : null
  }

  async resolveReport(
    reportId: bigint,
    examId: string,
    status: string,
    adminId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.report.updateMany({
      where: { id: reportId, examId },
      data: { status, resolvedBy: adminId, resolvedAt: new Date() },
    })
    return count > 0
  }
}
