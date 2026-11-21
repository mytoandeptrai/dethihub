import { Body, Controller, Get, Headers, HttpCode, Post, Query, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { ChatService } from '@/modules/ai/application/services/chat.service'
import { FeedbackService } from '@/modules/ai/application/services/feedback.service'
import { QuotaService } from '@/modules/ai/application/services/quota.service'
import { ChatRequestDto } from '@/modules/ai/presentation/dtos/chat-request.dto'
import { ChatResponseDto } from '@/modules/ai/presentation/dtos/chat-response.dto'
import { ChatEventStream } from '@/modules/ai/presentation/streaming/chat-event-stream'
import { CreditEventResponseDto } from '@/modules/ai/presentation/dtos/credit-event-response.dto'
import { CreditEventsQueryDto } from '@/modules/ai/presentation/dtos/credit-events-query.dto'
import { FeedbackRequestDto } from '@/modules/ai/presentation/dtos/feedback-request.dto'
import { QuotaResponseDto } from '@/modules/ai/presentation/dtos/quota-response.dto'
import { CheckMaintenance } from '@/shared-kernel/infrastructure/decorators/check-maintenance.decorator'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'
import { SkipTimeout } from '@/shared-kernel/infrastructure/decorators/skip-timeout.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { Response } from 'express'

@ApiTags('ai')
@ApiBearerAuth()
@RateLimit('llm')
@Controller('ai')
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly quotaService: QuotaService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Post('chat')
  @HttpCode(200)
  @CheckMaintenance()
  @SkipTimeout()
  @ApiOperation({ summary: 'Run an AI task (quota is reserved up front and settled after)' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChatRequestDto,
    @Res() response: Response,
    @Headers('x-ai-retry-of') retryOf?: string,
  ): Promise<void> {
    const stream = dto.stream && !dto.webSearch ? new ChatEventStream(response) : undefined
    try {
      const reply = ChatResponseDto.from(
        await this.chatService.chat({ ...dto, userId: user.id, retryOf }, stream),
      )
      if (stream?.started) stream.done(reply)
      else response.json(reply)
    } catch (error) {
      // once the stream is open the status line is gone: the failure travels as an event
      if (!stream?.started) throw error
      stream.fail(error)
    } finally {
      stream?.close()
    }
  }

  @Get('quota')
  @ApiOperation({ summary: 'AI points of the current account' })
  @ApiResponse({ status: 200, type: QuotaResponseDto })
  async quota(@CurrentUser() user: AuthenticatedUser): Promise<QuotaResponseDto> {
    const quota = await this.quotaService.readQuota(user.id)
    const granted = quota ? await this.quotaService.readGranted(user.id) : 0
    return QuotaResponseDto.from(quota, granted)
  }

  @Get('credits/events')
  @ApiOperation({ summary: 'Latest credit events of the current account' })
  @ApiResponse({ status: 200, type: CreditEventResponseDto, isArray: true })
  async creditEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreditEventsQueryDto,
  ): Promise<CreditEventResponseDto[]> {
    const events = await this.quotaService.listCreditEvents(user.id, query.limit ?? 20)
    return events.map((event) => CreditEventResponseDto.from(event))
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Record dissatisfaction with an AI reply' })
  @ApiResponse({ status: 201, description: '{ saved }' })
  async feedback(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FeedbackRequestDto,
  ): Promise<{ saved: boolean }> {
    const saved = await this.feedbackService.log({
      userId: user.id,
      kind: dto.kind,
      mode: dto.mode ?? 'exam',
      request: dto.request ?? '',
      reply: dto.reply ?? '',
      context: dto.context ?? '',
      note: dto.note ?? '',
    })
    return { saved }
  }
}
