import { HttpException, HttpStatus, Inject, Injectable, ConflictException } from '@nestjs/common'

import { REPORT_REPOSITORY } from '@/modules/exam/application/ports/report.repository.port'
import {
  ExamQueryService,
  examNotFound,
} from '@/modules/exam/application/services/exam-query.service'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { ReportRepositoryPort } from '@/modules/exam/application/ports/report.repository.port'

const REPORTS_PER_DAY = 10

@Injectable()
export class ReportService {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
    private readonly examQuery: ExamQueryService,
  ) {}

  async submit(
    reporterId: string,
    examId: string,
    reason: string,
    detail: string | null,
  ): Promise<void> {
    if (!(await this.examQuery.loadPublished(examId))) throw examNotFound('Không tìm thấy đề.')
    const result = await this.reports.create(
      { examId, reporterId, reason, detail },
      REPORTS_PER_DAY,
    )
    if (result === 'duplicate') {
      throw new ConflictException({
        code: ErrorCode.REPORT_DUPLICATE,
        message: 'Bạn đã báo cáo đề này rồi, kiểm duyệt viên đang xem.',
      })
    }
    if (result === 'limit') {
      throw new HttpException(
        { code: ErrorCode.REPORT_LIMIT, message: 'Bạn đã gửi nhiều báo cáo hôm nay, thử lại sau.' },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }
}
