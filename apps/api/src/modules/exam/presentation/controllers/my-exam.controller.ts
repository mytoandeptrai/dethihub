import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AttemptService } from '@/modules/exam/application/services/attempt.service'
import { ExamPublishService } from '@/modules/exam/application/services/exam-publish.service'
import { examIdPipe } from '@/modules/exam/presentation/controllers/community-exam.controller'
import { ExamCardDto } from '@/modules/exam/presentation/dtos/exam-card.dto'
import {
  ExamAttemptsPageDto,
  ExamAttemptsQueryDto,
  MyExamsQueryDto,
  PublishExamDto,
  SetListedDto,
} from '@/modules/exam/presentation/dtos/my-exam.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('exams')
@ApiBearerAuth()
@RateLimit('exam')
@Controller('me/exams')
export class MyExamController {
  constructor(
    private readonly publisher: ExamPublishService,
    private readonly attempts: AttemptService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Exams published by the current user, newest first' })
  @ApiResponse({ status: 200, type: ExamCardDto, isArray: true })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MyExamsQueryDto,
  ): Promise<ExamCardDto[]> {
    const cards = await this.publisher.list(user.id, query.limit, query.offset)
    return cards.map((card) => ExamCardDto.from(card))
  }

  @Get('count')
  async count(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return { count: await this.publisher.count(user.id) }
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Student attempts for exams owned by the current user' })
  @ApiResponse({ status: 200, type: ExamAttemptsPageDto })
  async attemptsOf(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExamAttemptsQueryDto,
  ): Promise<ExamAttemptsPageDto> {
    const page = await this.attempts.listForOwner(user.id, query.examIds, query.limit, query.cursor)
    return {
      items: page.items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      nextCursor: page.nextCursor,
    }
  }

  @Post()
  @ApiOperation({ summary: 'Publish an exam; listing columns are computed on the server' })
  @ApiResponse({ status: 201, type: ExamCardDto })
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PublishExamDto,
  ): Promise<ExamCardDto> {
    return ExamCardDto.fromExam(await this.publisher.publish(user.id, dto.doc, dto.listed))
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace the content of a published exam, keeping its link' })
  @ApiResponse({ status: 200, type: ExamCardDto })
  async replace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', examIdPipe) id: string,
    @Body() dto: PublishExamDto,
  ): Promise<ExamCardDto> {
    return ExamCardDto.fromExam(await this.publisher.replace(user.id, id, dto.doc, dto.listed))
  }

  @Patch(':id/listed')
  @HttpCode(204)
  async setListed(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', examIdPipe) id: string,
    @Body() dto: SetListedDto,
  ): Promise<void> {
    await this.publisher.setListed(user.id, id, dto.listed)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unpublish; student attempts, locks and reports go with it' })
  async unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', examIdPipe) id: string,
  ): Promise<void> {
    await this.publisher.unpublish(user.id, id)
  }
}
