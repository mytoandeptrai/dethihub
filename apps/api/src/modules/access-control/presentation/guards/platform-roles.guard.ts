import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { RoleAuthorizationService } from '@/modules/access-control/application/services/role-authorization.service'
import { PLATFORM_ROLE_KEY } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { CanActivate, ExecutionContext } from '@nestjs/common'

interface GuardedRequest {
  method: string
  path: string
  ip?: string
  route?: { path?: string }
  user?: AuthenticatedUser
  platformRole?: PlatformRole
}

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: RoleAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlatformRole | undefined>(PLATFORM_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required) return true

    const request = context.switchToHttp().getRequest<GuardedRequest>()
    if (!request.user) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_MISSING, message: 'Cần đăng nhập.' })
    }
    const action = `${request.method} ${request.route?.path ?? request.path}`
    request.platformRole = await this.authorization.authorize(
      request.user,
      required,
      action,
      request.ip ?? '',
    )
    return true
  }
}
