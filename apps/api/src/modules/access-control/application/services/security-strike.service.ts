import { Inject, Injectable } from '@nestjs/common'

import { ADMIN_AUDIT_REPOSITORY } from '@/modules/access-control/application/ports/admin-audit.repository.port'
import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'
import { SECURITY_FLAG_REPOSITORY } from '@/modules/access-control/application/ports/security-flag.repository.port'
import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'

import type { AdminAuditRepositoryPort } from '@/modules/access-control/application/ports/admin-audit.repository.port'
import type { AuthUserDirectoryPort } from '@/modules/access-control/application/ports/auth-user-directory.port'
import type { SecurityFlagRepositoryPort } from '@/modules/access-control/application/ports/security-flag.repository.port'

const PERMANENT_AFTER_STRIKES = 2
const TEMPORARY_BAN = '72h'
const PERMANENT_BAN = '876000h'

const MESSAGE_PERMANENT =
  'Tài khoản đã bị khoá vĩnh viễn do cố truy cập trái phép vào khu vực quản trị.'
const MESSAGE_TEMPORARY =
  'Tài khoản đã bị khoá 3 ngày và bị gắn cờ theo dõi do cố truy cập trái phép vào khu vực quản trị.'

@Injectable()
export class SecurityStrikeService {
  constructor(
    private readonly roles: PlatformRoleService,
    @Inject(SECURITY_FLAG_REPOSITORY) private readonly flags: SecurityFlagRepositoryPort,
    @Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectoryPort,
    @Inject(ADMIN_AUDIT_REPOSITORY) private readonly audit: AdminAuditRepositoryPort,
  ) {}

  /** Returns the warning to show the caller, or null when nothing was enforced (including infrastructure errors) */
  async recordIntruder(userId: string, action: string, ip: string): Promise<string | null> {
    try {
      if (await this.roles.getRole(userId, { fresh: true })) return null

      const { strikes, isNew } = await this.flags.recordStrike(userId, action, ip)
      const permanent = strikes >= PERMANENT_AFTER_STRIKES
      const message = permanent ? MESSAGE_PERMANENT : MESSAGE_TEMPORARY
      if (!isNew) return message

      try {
        await this.directory.ban(userId, permanent ? PERMANENT_BAN : TEMPORARY_BAN)
      } catch {
        await this.flags.revertStrike(userId, strikes - 1)
        return null
      }
      await this.directory.forgetBan(userId)
      await this.audit.record({
        adminId: null,
        action: 'security.strike',
        target: userId,
        detail: { strikes, action, ip, lock: permanent ? 'vĩnh viễn' : '3 ngày' },
      })
      return message
    } catch {
      return null
    }
  }
}
