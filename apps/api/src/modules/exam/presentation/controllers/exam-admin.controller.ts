import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { ExamAdminService } from '@/modules/exam/application/services/exam-admin.service'
import {
  AdminExamDetailDto,
  AdminExamDto,
  AdminExamListQueryDto,
  AdminExamListResponseDto,
  AdminReportDto,
  AdminReportListQueryDto,
  AdminReportListResponseDto,
  ResolveReportDto,
  SetExamStatusDto,
} from '@/modules/exam/presentation/dtos/exam-admin.dto'
import { CurrentRole } from '@/shared-kernel/infrastructure/decorators/current-role.decorator'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_PER_PAGE = 20

@ApiTags('admin-exams')
@ApiBearerAuth()
@RateLimit('admin')
@Controller('admin')
export class ExamAdminController {
  constructor(private readonly admin: ExamAdminService) {}

  @Get('exams')
  @PlatformRoles('moderator')
  @ApiOperation({ summary: 'Community exams (moderators see listed ones only), without the doc' })
  @ApiResponse({ status: 200, type: AdminExamListResponseDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRole() role: PlatformRole,
    @Query() query: AdminExamListQueryDto,
  ): Promise<AdminExamListResponseDto> {
    const { items, total } = await this.admin.list(
      { id: user.id, role },
      { q: query.q ?? '', status: query.status ?? '', subject: query.subject ?? '' },
      query.page ?? 1,
      query.perPage ?? DEFAULT_PER_PAGE,
    )
    return { items: items.map((item) => AdminExamDto.from(item)), total }
  }

  @Get('exams/:id')
  @PlatformRoles('moderator')
  @ApiOperation({ summary: 'One exam with its doc for preview' })
  @ApiResponse({ status: 200, type: AdminExamDetailDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRole() role: PlatformRole,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminExamDetailDto> {
    return AdminExamDetailDto.fromDetail(await this.admin.get({ id: user.id, role }, id))
  }

  @Patch('exams/:id/status')
  @PlatformRoles('moderator')
  @HttpCode(204)
  @ApiOperation({ summary: 'Publish, hide or remove an exam (removing needs a reason)' })
  async setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRole() role: PlatformRole,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetExamStatusDto,
  ): Promise<void> {
    await this.admin.setStatus({ id: user.id, role }, id, body.status, body.reason ?? '')
  }

  @Delete('exams/:id')
  @PlatformRoles('admin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an exam for good' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.admin.delete(user.id, id)
  }

  @Get('reports')
  @PlatformRoles('moderator')
  @ApiOperation({ summary: 'Exam reports (moderators see reports of listed exams only)' })
  @ApiResponse({ status: 200, type: AdminReportListResponseDto })
  async listReports(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRole() role: PlatformRole,
    @Query() query: AdminReportListQueryDto,
  ): Promise<AdminReportListResponseDto> {
    const { items, total } = await this.admin.listReports(
      { id: user.id, role },
      query.status ?? '',
      query.page ?? 1,
      query.perPage ?? DEFAULT_PER_PAGE,
    )
    return { items: items.map((item) => AdminReportDto.from(item)), total }
  }

  @Patch('reports/:id')
  @PlatformRoles('moderator')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark a report resolved or dismissed' })
  async resolveReport(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRole() role: PlatformRole,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResolveReportDto,
  ): Promise<void> {
    await this.admin.resolveReport({ id: user.id, role }, BigInt(id), body.status)
  }
}
