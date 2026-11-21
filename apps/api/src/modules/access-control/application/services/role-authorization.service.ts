import { ForbiddenException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'

import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'
import { BANNED_MESSAGE } from '@/modules/access-control/application/services/authentication.service'
import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { SecurityStrikeService } from '@/modules/access-control/application/services/security-strike.service'
import { satisfiesRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthUserDirectory } from '@/modules/access-control/application/ports/auth-user-directory.port'
import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const CHECK_UNAVAILABLE_MESSAGE = 'Không kiểm tra được quyền, thử lại sau.'
const FORBIDDEN_MESSAGE = 'Không có quyền.'

@Injectable()
export class RoleAuthorizationService {
  constructor(
    private readonly roles: PlatformRoleService,
    @Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectory,
    private readonly strike: SecurityStrikeService,
  ) {}

  async authorize(
    user: AuthenticatedUser,
    required: PlatformRole,
    action: string,
    ip: string,
  ): Promise<PlatformRole> {
    const role = await this.roles.getRole(user.id).catch(() => this.unavailable())

    if (!role || !satisfiesRole(role, required)) {
      const warning = role ? null : await this.strike.recordIntruder(user.id, action, ip)
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_SCOPE,
        message: warning ?? FORBIDDEN_MESSAGE,
      })
    }

    // Admin routes never trust the 30s ban cache: a just-banned admin must lose access immediately
    const banned = await this.directory
      .isBanned(user.id, { fresh: true })
      .catch(() => this.unavailable())
    if (banned) {
      throw new ForbiddenException({ code: ErrorCode.ACCOUNT_BANNED, message: BANNED_MESSAGE })
    }
    return role
  }

  private unavailable(): never {
    throw new ServiceUnavailableException({
      code: ErrorCode.AUTH_CHECK_UNAVAILABLE,
      message: CHECK_UNAVAILABLE_MESSAGE,
    })
  }
}
