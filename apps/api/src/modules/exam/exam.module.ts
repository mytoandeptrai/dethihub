import { Module } from '@nestjs/common'

import { ATTEMPT_REPOSITORY } from '@/modules/exam/application/ports/attempt.repository.port'
import { EXAM_REPOSITORY } from '@/modules/exam/application/ports/exam.repository.port'
import { REPORT_REPOSITORY } from '@/modules/exam/application/ports/report.repository.port'
import { AttemptService } from '@/modules/exam/application/services/attempt.service'
import { ExamPublishService } from '@/modules/exam/application/services/exam-publish.service'
import { ExamQueryService } from '@/modules/exam/application/services/exam-query.service'
import { ReportService } from '@/modules/exam/application/services/report.service'
import { AttemptRepositoryImpl } from '@/modules/exam/infrastructure/repositories/attempt.repository'
import { ExamRepositoryImpl } from '@/modules/exam/infrastructure/repositories/exam.repository'
import { ReportRepositoryImpl } from '@/modules/exam/infrastructure/repositories/report.repository'
import { CommunityExamController } from '@/modules/exam/presentation/controllers/community-exam.controller'
import { ExamReportController } from '@/modules/exam/presentation/controllers/exam-report.controller'
import { MyExamController } from '@/modules/exam/presentation/controllers/my-exam.controller'

@Module({
  controllers: [CommunityExamController, MyExamController, ExamReportController],
  providers: [
    ExamQueryService,
    ExamPublishService,
    AttemptService,
    ReportService,
    { provide: EXAM_REPOSITORY, useClass: ExamRepositoryImpl },
    { provide: ATTEMPT_REPOSITORY, useClass: AttemptRepositoryImpl },
    { provide: REPORT_REPOSITORY, useClass: ReportRepositoryImpl },
  ],
})
export class ExamModule {}
