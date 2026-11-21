import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'
import { CHECK_MAINTENANCE_KEY } from '@/shared-kernel/infrastructure/decorators/check-maintenance.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly maintenance: MaintenanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const enabled = this.reflector.getAllAndOverride<boolean | undefined>(CHECK_MAINTENANCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!enabled) return true

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    const message = await this.maintenance.blockMessage(user?.id)
    if (message) throw new ServiceUnavailableException({ code: ErrorCode.MAINTENANCE, message })
    return true
  }
}
