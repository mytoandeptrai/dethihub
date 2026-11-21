import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AttemptService } from '@/modules/exam/application/services/attempt.service'
import { ExamQueryService } from '@/modules/exam/application/services/exam-query.service'
import {
  CommunityAuthorsQueryDto,
  CommunityListQueryDto,
  GateQueryDto,
} from '@/modules/exam/presentation/dtos/community-queries.dto'
import { ExamCardDto } from '@/modules/exam/presentation/dtos/exam-card.dto'
import {
  GateResponseDto,
  PlayResponseDto,
} from '@/modules/exam/presentation/dtos/play-response.dto'
import {
  AttemptResultDto,
  SubmitAttemptDto,
} from '@/modules/exam/presentation/dtos/submit-attempt.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { CommunityAuthor } from '@/modules/exam/application/services/exam-query.service'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

export const examIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException({ code: ErrorCode.INVALID_UUID, message: 'Link đề không hợp lệ.' }),
})

@ApiTags('exams')
@Public()
@RateLimit('exam')
@Controller('exams')
export class CommunityExamController {
  constructor(
    private readonly queries: ExamQueryService,
    private readonly attempts: AttemptService,
  ) {}

  @Get('community')
  @ApiOperation({ summary: 'Listed exams for the community page (no document)' })
  @ApiResponse({ status: 200, type: ExamCardDto, isArray: true })
  async community(@Query() query: CommunityListQueryDto): Promise<ExamCardDto[]> {
    const cards = await this.queries.listCommunity(query.limit ?? 100)
    return cards.map((card) => ExamCardDto.from(card))
  }

  @Get('community/authors')
  @ApiOperation({ summary: 'Display name and avatar of community authors' })
  authors(@Query() query: CommunityAuthorsQueryDto): Promise<CommunityAuthor[]> {
    return this.queries.authors(query.ids)
  }

  @Get('community/:id')
  @ApiOperation({ summary: 'Full document of a listed exam, without the class roster' })
  async communityDoc(@Param('id', examIdPipe) id: string): Promise<Record<string, unknown>> {
    return (await this.queries.communityDoc(id)) as unknown as Record<string, unknown>
  }

  @Get(':id/play')
  @ApiOperation({ summary: 'Open an exam by link; link-only exams come without answers' })
  @ApiResponse({ status: 200, type: PlayResponseDto })
  async play(@Param('id', examIdPipe) id: string): Promise<PlayResponseDto> {
    return PlayResponseDto.from(await this.queries.play(id))
  }

  @Get(':id/gate')
  @ApiOperation({ summary: 'Early hint whether this student already submitted' })
  @ApiResponse({ status: 200, type: GateResponseDto })
  gate(
    @Param('id', examIdPipe) id: string,
    @Query() query: GateQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<GateResponseDto> {
    const deviceId = query.deviceId && query.deviceId.length >= 8 ? query.deviceId : null
    return this.queries.gate(id, user?.id ?? null, deviceId)
  }

  @Post(':id/attempts')
  @HttpCode(200)
  @RateLimit('attempt', 'attempt-exam')
  @ApiOperation({ summary: 'Submit answers; the server grades them' })
  @ApiResponse({ status: 200, type: AttemptResultDto })
  async submit(
    @Param('id', examIdPipe) id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<AttemptResultDto> {
    const outcome = await this.attempts.submit({
      examId: id,
      userId: user?.id ?? null,
      name: dto.name,
      answers: dto.answers,
      seconds: dto.seconds,
      deviceId: dto.deviceId,
      className: dto.className,
      seat: dto.seat,
    })
    return AttemptResultDto.from(outcome)
  }
}
