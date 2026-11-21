import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { BankService } from '@/modules/bank/application/services/bank.service'
import {
  AdminOverrideDto,
  BankSavedResponseDto,
  BankVisionDto,
  BankVisionResponseDto,
  HideBankQuestionDto,
  SaveBankQuestionDto,
} from '@/modules/bank/presentation/dtos/bank.dto'
import { QuestionIdPipe } from '@/modules/bank/presentation/pipes/question-id.pipe'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('admin-bank')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin/bank')
export class AdminBankController {
  constructor(private readonly bank: BankService) {}

  @Get('overrides')
  @ApiOperation({ summary: 'All overrides with full data, newest first' })
  @ApiResponse({ status: 200, type: [AdminOverrideDto] })
  async overrides(): Promise<AdminOverrideDto[]> {
    return (await this.bank.listAdmin()).map((row) => AdminOverrideDto.fromRow(row))
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create a question (id is made by the server)' })
  @ApiResponse({ status: 201, type: BankSavedResponseDto })
  create(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: SaveBankQuestionDto,
  ): Promise<BankSavedResponseDto> {
    return this.bank.save(
      admin.id,
      null,
      body.entry,
      body.status === 'hidden' ? 'hidden' : 'published',
    )
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Override a static question or edit a created one' })
  @ApiResponse({ status: 200, type: BankSavedResponseDto })
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', QuestionIdPipe) id: string,
    @Body() body: SaveBankQuestionDto,
  ): Promise<BankSavedResponseDto> {
    return this.bank.save(
      admin.id,
      id,
      body.entry,
      body.status === 'hidden' ? 'hidden' : 'published',
    )
  }

  @Post('questions/:id/hide')
  @HttpCode(204)
  @ApiOperation({ summary: 'Hide a question' })
  hide(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', QuestionIdPipe) id: string,
    @Body() body: HideBankQuestionDto,
  ): Promise<void> {
    return this.bank.hide(admin.id, id, body.entry)
  }

  @Post('questions/:id/unhide')
  @HttpCode(204)
  @ApiOperation({ summary: 'Publish a hidden question again' })
  unhide(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', QuestionIdPipe) id: string,
  ): Promise<void> {
    return this.bank.unhide(admin.id, id)
  }

  @Delete('questions/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Drop the override (revert a static question, delete a created one)' })
  revert(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', QuestionIdPipe) id: string,
  ): Promise<void> {
    return this.bank.revert(admin.id, id)
  }

  @Post('vision')
  @HttpCode(200)
  @ApiOperation({ summary: 'Read exam page images into question JSON (no points charged)' })
  @ApiResponse({ status: 200, type: BankVisionResponseDto })
  vision(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: BankVisionDto,
  ): Promise<BankVisionResponseDto> {
    return this.bank.readImages(admin.id, body.images)
  }
}
