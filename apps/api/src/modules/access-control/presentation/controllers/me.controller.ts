import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { MeResponseDto } from '@/modules/access-control/presentation/dtos/me-response.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('platform')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly roles: PlatformRoleService) {}

  @Get()
  @ApiOperation({ summary: 'Current account id and platform role' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return MeResponseDto.from(user.id, await this.roles.getRole(user.id))
  }
}
