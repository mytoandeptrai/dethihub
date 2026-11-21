import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AiAdminService } from '@/modules/ai/application/services/ai-admin.service'
import { EMPTY_FREE_PER_DAY } from '@/modules/ai/domain/billing'
import {
  AiErrorDto,
  AiErrorsQueryDto,
  AiErrorsResponseDto,
  AiStatsQueryDto,
  AiStatsResponseDto,
  BalanceResponseDto,
  GrantCreditsDto,
  PingResponseDto,
  ProviderDto,
  ProvidersResponseDto,
  SaveProviderDto,
  SetQuotaDto,
  UserQuotaResponseDto,
} from '@/modules/ai/presentation/dtos/ai-admin.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { ProtectTarget } from '@/shared-kernel/infrastructure/decorators/protect-target.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_DAYS = 7
const DEFAULT_ERRORS = 30

@ApiTags('admin-ai')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin/ai')
export class AiAdminController {
  constructor(private readonly admin: AiAdminService) {}

  @Get('users/:id/quota')
  @ApiOperation({ summary: 'Quota override, usage and credit balance of a user' })
  @ApiResponse({ status: 200, type: UserQuotaResponseDto })
  async getQuota(@Param('id', ParseUUIDPipe) id: string): Promise<UserQuotaResponseDto> {
    return UserQuotaResponseDto.from(await this.admin.getQuota(id))
  }

  @Put('users/:id/quota')
  @HttpCode(204)
  @ProtectTarget('quota.set')
  @ApiOperation({ summary: 'Set the monthly token limit of a user (null = unlimited)' })
  async setQuota(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetQuotaDto,
  ): Promise<void> {
    await this.admin.setQuota(admin.id, id, body.monthlyTokens, body.note ?? '')
  }

  @Delete('users/:id/quota')
  @HttpCode(204)
  @ProtectTarget('quota.clear')
  @ApiOperation({ summary: 'Remove the override; the default monthly limit applies again' })
  async clearQuota(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.admin.clearQuota(admin.id, id)
  }

  @Post('users/:id/credits')
  @ProtectTarget('credits.grant')
  @ApiOperation({ summary: 'Add tokens to a balance (claims the welcome gift first when missing)' })
  @ApiResponse({ status: 201, type: BalanceResponseDto })
  async grantCredits(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: GrantCreditsDto,
  ): Promise<BalanceResponseDto> {
    return { balance: await this.admin.grantCredits(admin.id, id, body.tokens, body.note ?? '') }
  }

  @Get('stats')
  @ApiOperation({ summary: 'AI calls per day, model and provider' })
  @ApiResponse({ status: 200, type: AiStatsResponseDto })
  async stats(@Query() query: AiStatsQueryDto): Promise<AiStatsResponseDto> {
    const days = query.days ?? DEFAULT_DAYS
    return AiStatsResponseDto.from(days, await this.admin.stats(days))
  }

  @Get('errors')
  @ApiOperation({ summary: 'Latest failed AI calls with the affected user' })
  @ApiResponse({ status: 200, type: AiErrorsResponseDto })
  async errors(@Query() query: AiErrorsQueryDto): Promise<AiErrorsResponseDto> {
    const rows = await this.admin.errors(query.limit ?? DEFAULT_ERRORS)
    return { freeEmpty: EMPTY_FREE_PER_DAY, items: rows.map((row) => AiErrorDto.from(row)) }
  }

  @Get('providers')
  @ApiOperation({ summary: 'Provider settings with masked keys (no call is made)' })
  @ApiResponse({ status: 200, type: ProvidersResponseDto })
  async providers(): Promise<ProvidersResponseDto> {
    return { providers: (await this.admin.listProviders()).map((view) => ProviderDto.from(view)) }
  }

  @Put('providers/:provider')
  @ApiOperation({ summary: 'Save model, endpoint and API key of a provider' })
  @ApiResponse({ status: 200, type: ProvidersResponseDto })
  async saveProvider(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('provider') provider: string,
    @Body() body: SaveProviderDto,
  ): Promise<ProvidersResponseDto> {
    const views = await this.admin.saveProvider(admin.id, provider, {
      model: body.model ?? '',
      endpoint: body.endpoint ?? '',
      apiKey: body.apiKey ?? '',
    })
    return { providers: views.map((view) => ProviderDto.from(view)) }
  }

  @Delete('providers/:provider')
  @ApiOperation({ summary: 'Drop the saved settings; the provider falls back to the environment' })
  @ApiResponse({ status: 200, type: ProvidersResponseDto })
  async resetProvider(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('provider') provider: string,
  ): Promise<ProvidersResponseDto> {
    const views = await this.admin.resetProvider(admin.id, provider)
    return { providers: views.map((view) => ProviderDto.from(view)) }
  }

  @Post('providers/:provider/ping')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a one-word prompt to a provider (costs a few tokens)' })
  @ApiResponse({ status: 200, type: PingResponseDto })
  ping(@Param('provider') provider: string): Promise<PingResponseDto> {
    return this.admin.ping(provider)
  }
}
