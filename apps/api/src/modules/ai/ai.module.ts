import { Global, Module } from '@nestjs/common'

import { UserDeletionListener } from '@/modules/ai/application/listeners/user-deletion.listener'
import { AI_CALL_LOG_REPOSITORY } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import { CREDIT_REPOSITORY } from '@/modules/ai/application/ports/credit.repository.port'
import { FEEDBACK_REPOSITORY } from '@/modules/ai/application/ports/feedback.repository.port'
import {
  ANTHROPIC_PROVIDER,
  OPENAI_COMPATIBLE_PROVIDER,
} from '@/modules/ai/application/ports/llm-provider.port'
import { PROVIDER_SETTINGS_REPOSITORY } from '@/modules/ai/application/ports/provider-settings.repository.port'
import { QUOTA_REPOSITORY } from '@/modules/ai/application/ports/quota.repository.port'
import { TASK_PROMPTS } from '@/modules/ai/application/ports/task-prompts.port'
import { USER_DATA_REPOSITORY } from '@/modules/ai/application/ports/user-data.repository.port'
import { AiAdminService } from '@/modules/ai/application/services/ai-admin.service'
import { ChatService } from '@/modules/ai/application/services/chat.service'
import { FeedbackService } from '@/modules/ai/application/services/feedback.service'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import { QuotaService } from '@/modules/ai/application/services/quota.service'
import { WelcomePointsService } from '@/modules/ai/application/services/welcome-points.service'
import { AiMeterAdapter } from '@/modules/ai/infrastructure/adapters/ai-meter.adapter'
import { AnthropicAdapter } from '@/modules/ai/infrastructure/adapters/anthropic.adapter'
import { CreditGrantAdapter } from '@/modules/ai/infrastructure/adapters/credit-grant.adapter'
import { OpenAiCompatibleAdapter } from '@/modules/ai/infrastructure/adapters/openai-compatible.adapter'
import { TaskPromptsAdapter } from '@/modules/ai/infrastructure/adapters/task-prompts.adapter'
import { VisionReaderAdapter } from '@/modules/ai/infrastructure/adapters/vision-reader.adapter'
import { AiCallLogRepositoryImpl } from '@/modules/ai/infrastructure/repositories/ai-call-log.repository'
import { CreditRepositoryImpl } from '@/modules/ai/infrastructure/repositories/credit.repository'
import { FeedbackRepositoryImpl } from '@/modules/ai/infrastructure/repositories/feedback.repository'
import { ProviderSettingsRepositoryImpl } from '@/modules/ai/infrastructure/repositories/provider-settings.repository'
import { QuotaRepositoryImpl } from '@/modules/ai/infrastructure/repositories/quota.repository'
import { UserDataRepositoryImpl } from '@/modules/ai/infrastructure/repositories/user-data.repository'
import { AiAdminController } from '@/modules/ai/presentation/controllers/ai-admin.controller'
import { AiController } from '@/modules/ai/presentation/controllers/ai.controller'
import { AppSettingsModule } from '@/modules/app-settings/app-settings.module'
import { AI_METER } from '@/shared-kernel/application/ports/ai-meter.port'
import { CREDIT_GRANT } from '@/shared-kernel/application/ports/credit-grant.port'
import { VISION_READER } from '@/shared-kernel/application/ports/vision-reader.port'

@Global() // @global-approved: other contexts meter AI points, read images and grant credits through shared-kernel ports
@Module({
  imports: [AppSettingsModule],
  controllers: [AiController, AiAdminController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    ChatService,
    AiAdminService,
    ProviderConfigService,
    QuotaService,
    WelcomePointsService,
    FeedbackService,
    { provide: QUOTA_REPOSITORY, useClass: QuotaRepositoryImpl },
    { provide: CREDIT_REPOSITORY, useClass: CreditRepositoryImpl },
    { provide: FEEDBACK_REPOSITORY, useClass: FeedbackRepositoryImpl },
    { provide: AI_CALL_LOG_REPOSITORY, useClass: AiCallLogRepositoryImpl },
    { provide: PROVIDER_SETTINGS_REPOSITORY, useClass: ProviderSettingsRepositoryImpl },
    { provide: TASK_PROMPTS, useClass: TaskPromptsAdapter },
    { provide: OPENAI_COMPATIBLE_PROVIDER, useClass: OpenAiCompatibleAdapter },
    { provide: ANTHROPIC_PROVIDER, useClass: AnthropicAdapter },
    { provide: AI_METER, useClass: AiMeterAdapter },
    { provide: VISION_READER, useClass: VisionReaderAdapter },
    { provide: CREDIT_GRANT, useClass: CreditGrantAdapter },
  ],
  exports: [AI_METER, VISION_READER, CREDIT_GRANT],
})
export class AiModule {}
