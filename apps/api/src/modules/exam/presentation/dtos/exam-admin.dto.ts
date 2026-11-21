import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

import { Trim } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'
import { AdminPageQueryDto } from '@/shared-kernel/infrastructure/dtos/admin-page-query.dto'

import type {
  AdminExamDetail,
  AdminReportRow,
} from '@/modules/exam/application/ports/exam-admin.repository.port'
import type {
  ExamWithOwner,
  ReportWithReporter,
} from '@/modules/exam/application/services/exam-admin.service'

export class AdminExamListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Title contains, max 100 chars' })
  @IsOptional()
  @Trim(100)
  @IsString()
  q?: string

  @ApiPropertyOptional({ enum: ['published', 'hidden', 'removed'] })
  @IsOptional()
  @Trim(20)
  @IsString()
  status?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Trim(50)
  @IsString()
  subject?: string
}

export class AdminReportListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: ['open', 'resolved', 'dismissed'] })
  @IsOptional()
  @Trim(20)
  @IsString()
  status?: string
}

export class SetExamStatusDto {
  @ApiProperty({ enum: ['published', 'hidden', 'removed'] })
  @Trim(20)
  @IsString()
  status!: string

  @ApiPropertyOptional({ description: 'Required when removing, max 500 chars' })
  @IsOptional()
  @Trim(500)
  @IsString()
  reason?: string
}

export class ResolveReportDto {
  @ApiProperty({ enum: ['resolved', 'dismissed'] })
  @Trim(20)
  @IsString()
  status!: string
}

export class AdminExamDto {
  @ApiProperty() id!: string
  @ApiProperty({ nullable: true }) ownerId!: string | null
  @ApiProperty({ nullable: true }) ownerEmail!: string | null
  @ApiProperty() title!: string
  @ApiProperty() subject!: string
  @ApiProperty() grade!: string
  @ApiProperty() school!: string
  @ApiProperty() createdAt!: string
  @ApiProperty() questionCount!: number
  @ApiProperty() durationMinutes!: number
  @ApiProperty() totalPoints!: number
  @ApiProperty() preview!: string
  @ApiProperty() listed!: boolean
  @ApiProperty({ enum: ['published', 'hidden', 'removed'] }) status!: string
  @ApiProperty({ nullable: true }) removedReason!: string | null
  @ApiProperty({ nullable: true }) moderatedBy!: string | null
  @ApiProperty({ nullable: true }) moderatedAt!: string | null
  @ApiProperty({ nullable: true }) missingKeys!: number | null
  @ApiProperty() openReports!: number

  static from({ exam, ownerEmail }: ExamWithOwner): AdminExamDto {
    return {
      id: exam.id,
      ownerId: exam.ownerId,
      ownerEmail,
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      school: exam.school,
      createdAt: exam.createdAt.toISOString(),
      questionCount: exam.questionCount,
      durationMinutes: exam.durationMinutes,
      totalPoints: exam.totalPoints,
      preview: exam.preview,
      listed: exam.listed,
      status: exam.status,
      removedReason: exam.removedReason,
      moderatedBy: exam.moderatedBy,
      moderatedAt: exam.moderatedAt?.toISOString() ?? null,
      missingKeys: exam.missingKeys,
      openReports: exam.openReports,
    }
  }
}

export class AdminExamDetailDto extends AdminExamDto {
  @ApiProperty({ type: 'object', additionalProperties: true }) doc!: unknown

  static fromDetail(detail: AdminExamDetail): AdminExamDetailDto {
    return { ...AdminExamDto.from({ exam: detail, ownerEmail: null }), doc: detail.doc }
  }
}

export class AdminExamListResponseDto {
  @ApiProperty({ type: [AdminExamDto] }) items!: AdminExamDto[]
  @ApiProperty() total!: number
}

export class AdminReportDto {
  @ApiProperty() id!: string
  @ApiProperty() examId!: string
  @ApiProperty({ nullable: true }) examTitle!: string | null
  @ApiProperty({ nullable: true }) reporterId!: string | null
  @ApiProperty({ nullable: true }) reporterEmail!: string | null
  @ApiProperty() reason!: string
  @ApiProperty({ nullable: true }) detail!: string | null
  @ApiProperty({ enum: ['open', 'resolved', 'dismissed'] }) status!: string
  @ApiProperty() createdAt!: string
  @ApiProperty({ nullable: true }) resolvedBy!: string | null
  @ApiProperty({ nullable: true }) resolvedAt!: string | null

  static from({ report, reporterEmail }: ReportWithReporter): AdminReportDto {
    return AdminReportDto.build(report, reporterEmail)
  }

  private static build(report: AdminReportRow, reporterEmail: string | null): AdminReportDto {
    return {
      id: report.id,
      examId: report.examId,
      examTitle: report.examTitle,
      reporterId: report.reporterId,
      reporterEmail,
      reason: report.reason,
      detail: report.detail,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
    }
  }
}

export class AdminReportListResponseDto {
  @ApiProperty({ type: [AdminReportDto] }) items!: AdminReportDto[]
  @ApiProperty() total!: number
}
