import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { FeedbackService } from '@/modules/feedback/application/services/feedback.service'
import { SubmitFeedbackDto } from '@/modules/feedback/presentation/dtos/feedback.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('platform')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  // Guests may send too; the account (when a token is present) comes from the token, never the body
  @Post()
  @Public()
  @RateLimit('feedback')
  @HttpCode(204)
  @ApiOperation({ summary: 'Send feedback (guest or signed in)' })
  async submit(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: SubmitFeedbackDto,
  ): Promise<void> {
    await this.feedback.submit({
      userId: user?.id ?? null,
      email: body.email || user?.email || null,
      message: body.message,
      page: body.page || null,
    })
  }
}
