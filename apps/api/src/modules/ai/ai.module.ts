import { Module } from '@nestjs/common'

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
import { ChatService } from '@/modules/ai/application/services/chat.service'
import { FeedbackService } from '@/modules/ai/application/services/feedback.service'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import { QuotaService } from '@/modules/ai/application/services/quota.service'
import { AnthropicAdapter } from '@/modules/ai/infrastructure/adapters/anthropic.adapter'
import { OpenAiCompatibleAdapter } from '@/modules/ai/infrastructure/adapters/openai-compatible.adapter'
import { TaskPromptsAdapter } from '@/modules/ai/infrastructure/adapters/task-prompts.adapter'
import { AiCallLogRepositoryImpl } from '@/modules/ai/infrastructure/repositories/ai-call-log.repository'
import { CreditRepositoryImpl } from '@/modules/ai/infrastructure/repositories/credit.repository'
import { FeedbackRepositoryImpl } from '@/modules/ai/infrastructure/repositories/feedback.repository'
import { ProviderSettingsRepositoryImpl } from '@/modules/ai/infrastructure/repositories/provider-settings.repository'
import { QuotaRepositoryImpl } from '@/modules/ai/infrastructure/repositories/quota.repository'
import { AiController } from '@/modules/ai/presentation/controllers/ai.controller'

@Module({
  controllers: [AiController],
  providers: [
    ChatService,
    ProviderConfigService,
    QuotaService,
    FeedbackService,
    { provide: QUOTA_REPOSITORY, useClass: QuotaRepositoryImpl },
    { provide: CREDIT_REPOSITORY, useClass: CreditRepositoryImpl },
    { provide: FEEDBACK_REPOSITORY, useClass: FeedbackRepositoryImpl },
    { provide: AI_CALL_LOG_REPOSITORY, useClass: AiCallLogRepositoryImpl },
    { provide: PROVIDER_SETTINGS_REPOSITORY, useClass: ProviderSettingsRepositoryImpl },
    { provide: TASK_PROMPTS, useClass: TaskPromptsAdapter },
    { provide: OPENAI_COMPATIBLE_PROVIDER, useClass: OpenAiCompatibleAdapter },
    { provide: ANTHROPIC_PROVIDER, useClass: AnthropicAdapter },
  ],
})
export class AiModule {}
