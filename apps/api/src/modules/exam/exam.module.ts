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
import { EXAM_ADMIN_REPOSITORY } from '@/modules/exam/application/ports/exam-admin.repository.port'
import { ExamAdminService } from '@/modules/exam/application/services/exam-admin.service'
import { ExamAdminRepositoryImpl } from '@/modules/exam/infrastructure/repositories/exam-admin.repository'
import { ExamAdminController } from '@/modules/exam/presentation/controllers/exam-admin.controller'
import { MyExamController } from '@/modules/exam/presentation/controllers/my-exam.controller'
import { USER_DATA_REPOSITORY } from '@/modules/exam/application/ports/user-data.repository.port'
import { UserDeletionListener } from '@/modules/exam/application/listeners/user-deletion.listener'
import { UserDataRepositoryImpl } from '@/modules/exam/infrastructure/repositories/user-data.repository'

@Module({
  controllers: [CommunityExamController, MyExamController, ExamReportController, ExamAdminController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    ExamQueryService,
    ExamPublishService,
    AttemptService,
    ReportService,
    ExamAdminService,
    { provide: EXAM_ADMIN_REPOSITORY, useClass: ExamAdminRepositoryImpl },
    { provide: EXAM_REPOSITORY, useClass: ExamRepositoryImpl },
    { provide: ATTEMPT_REPOSITORY, useClass: AttemptRepositoryImpl },
    { provide: REPORT_REPOSITORY, useClass: ReportRepositoryImpl },
  ],
})
export class ExamModule {}
