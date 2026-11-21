import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { PROTECT_TARGET_KEY } from '@/shared-kernel/infrastructure/decorators/protect-target.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { CanActivate, ExecutionContext } from '@nestjs/common'

interface GuardedRequest {
  params: Record<string, string | undefined>
  user?: AuthenticatedUser
}

const SELF_MESSAGE = 'Không thao tác trên chính tài khoản của bạn.'
const ADMIN_MESSAGE = 'Không thao tác trên tài khoản admin khác.'

@Injectable()
export class TargetProtectionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: PlatformRoleService,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.get<string | undefined>(PROTECT_TARGET_KEY, context.getHandler())
    if (!action) return true

    const { params, user } = context.switchToHttp().getRequest<GuardedRequest>()
    const targetId = params.id
    if (!user || !targetId) return true

    const isSelf = targetId === user.id
    const isAdmin = !isSelf && (await this.roles.getRole(targetId, { fresh: true })) === 'admin'
    if (!isSelf && !isAdmin) return true

    await this.audit.record(user.id, `${action}.denied`, targetId, {
      reason: isSelf ? 'self' : 'admin',
    })
    throw new BadRequestException({
      code: ErrorCode.ADMIN_TARGET_PROTECTED,
      message: isSelf ? SELF_MESSAGE : ADMIN_MESSAGE,
    })
  }
}
