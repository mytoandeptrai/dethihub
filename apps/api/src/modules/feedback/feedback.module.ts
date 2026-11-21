import { Module } from '@nestjs/common'

import { UserDeletionListener } from '@/modules/feedback/application/listeners/user-deletion.listener'
import { FEEDBACK_REPOSITORY } from '@/modules/feedback/application/ports/feedback.repository.port'
import { USER_DATA_REPOSITORY } from '@/modules/feedback/application/ports/user-data.repository.port'
import { FeedbackService } from '@/modules/feedback/application/services/feedback.service'
import { FeedbackRepositoryImpl } from '@/modules/feedback/infrastructure/repositories/feedback.repository'
import { UserDataRepositoryImpl } from '@/modules/feedback/infrastructure/repositories/user-data.repository'
import { AdminFeedbackController } from '@/modules/feedback/presentation/controllers/admin-feedback.controller'
import { FeedbackController } from '@/modules/feedback/presentation/controllers/feedback.controller'

@Module({
  controllers: [AdminFeedbackController, FeedbackController],
  providers: [
    FeedbackService,
    UserDeletionListener,
    { provide: FEEDBACK_REPOSITORY, useClass: FeedbackRepositoryImpl },
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
  ],
})
export class FeedbackModule {}
