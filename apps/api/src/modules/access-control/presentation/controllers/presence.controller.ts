import { Controller, HttpCode, Inject, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { PRESENCE_REPOSITORY } from '@/modules/access-control/application/ports/presence.repository.port'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'

import type { PresenceRepositoryPort } from '@/modules/access-control/application/ports/presence.repository.port'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('platform')
@ApiBearerAuth()
@Controller('presence')
export class PresenceController {
  constructor(@Inject(PRESENCE_REPOSITORY) private readonly presence: PresenceRepositoryPort) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Online heartbeat of the signed-in user' })
  async ping(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.presence.touch(user.id)
  }
}
