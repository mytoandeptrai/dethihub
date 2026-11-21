import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { FEEDBACK_REPOSITORY } from '@/modules/feedback/application/ports/feedback.repository.port'
import {
  FeedbackListQueryDto,
  FeedbackListResponseDto,
  FeedbackResponseDto,
  MarkFeedbackReadDto,
} from '@/modules/feedback/presentation/dtos/feedback.dto'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { FeedbackRepositoryPort } from '@/modules/feedback/application/ports/feedback.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_PER_PAGE = 20

@ApiTags('admin-feedback')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin/feedback')
export class AdminFeedbackController {
  constructor(
    @Inject(FEEDBACK_REPOSITORY) private readonly feedback: FeedbackRepositoryPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'User feedback, newest first' })
  @ApiResponse({ status: 200, type: FeedbackListResponseDto })
  async list(@Query() query: FeedbackListQueryDto): Promise<FeedbackListResponseDto> {
    const { rows, total } = await this.feedback.list(
      query.page ?? 1,
      query.perPage ?? DEFAULT_PER_PAGE,
      query.read,
    )
    return { items: rows.map((row) => FeedbackResponseDto.from(row)), total }
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark feedback read or unread (unknown ids are ignored)' })
  async markRead(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MarkFeedbackReadDto,
  ): Promise<void> {
    const read = body.read ?? true
    await this.feedback.setRead(BigInt(id), read)
    await this.audit.record(admin.id, 'content.feedback.markRead', String(id), { read })
  }
}
