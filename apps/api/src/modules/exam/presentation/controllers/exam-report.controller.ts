import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ReportService } from '@/modules/exam/application/services/report.service'
import { examIdPipe } from '@/modules/exam/presentation/controllers/community-exam.controller'
import { ReportRequestDto } from '@/modules/exam/presentation/dtos/my-exam.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('exams')
@ApiBearerAuth()
@RateLimit('exam')
@Controller('exams')
export class ExamReportController {
  constructor(private readonly reports: ReportService) {}

  @Post(':id/reports')
  @HttpCode(204)
  @ApiOperation({ summary: 'Report an exam to the moderators' })
  async report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', examIdPipe) id: string,
    @Body() dto: ReportRequestDto,
  ): Promise<void> {
    await this.reports.submit(user.id, id, dto.reason, dto.detail?.trim() || null)
  }
}
