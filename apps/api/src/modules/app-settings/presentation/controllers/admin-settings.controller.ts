import { Body, Controller, Get, Param, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AdminSettingsService } from '@/modules/app-settings/application/services/admin-settings.service'
import {
  SetSettingDto,
  SettingValueResponseDto,
  SettingsResponseDto,
} from '@/modules/app-settings/presentation/dtos/admin-settings.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('admin-settings')
@ApiBearerAuth()
@RateLimit('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  @PlatformRoles('moderator')
  @ApiOperation({ summary: 'Maintenance, announcements, pricing and AI welcome settings' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  async getAll(): Promise<SettingsResponseDto> {
    return (await this.settings.getAll()) as unknown as SettingsResponseDto
  }

  @Put(':key')
  @PlatformRoles('admin')
  @ApiOperation({
    summary: 'Validate and save one setting (maintenance | announcements | pricing | ai_welcome)',
  })
  @ApiResponse({ status: 200, type: SettingValueResponseDto })
  async set(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('key') key: string,
    @Body() body: SetSettingDto,
  ): Promise<SettingValueResponseDto> {
    return { value: await this.settings.set(admin.id, key, body.value) }
  }
}
