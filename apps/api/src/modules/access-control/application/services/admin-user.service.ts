import { Inject, Injectable } from '@nestjs/common'

import { ADMIN_USER_REPOSITORY } from '@/modules/access-control/application/ports/admin-user.repository.port'
import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'

import type {
  AdminUserRepositoryPort,
  AuditRow,
  UserActivity,
} from '@/modules/access-control/application/ports/admin-user.repository.port'
import type {
  AuthUser,
  AuthUserDirectoryPort,
} from '@/modules/access-control/application/ports/auth-user-directory.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

const PERMANENT_BAN = '876000h'

export interface AdminUserView {
  user: AuthUser
  activity: UserActivity | null
}

@Injectable()
export class AdminUserService {
  constructor(
    @Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectoryPort,
    @Inject(ADMIN_USER_REPOSITORY) private readonly repository: AdminUserRepositoryPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
  ) {}

  async list(
    page: number,
    perPage: number,
    query: string,
  ): Promise<{ items: AdminUserView[]; total: number }> {
    const { users, total } = await this.directory.listUsers(
      page,
      perPage,
      query.trim() || undefined,
    )
    const activity = new Map(
      (await this.repository.activityOf(users.map((user) => user.id))).map((row) => [
        row.userId,
        row,
      ]),
    )
    const items = users
      .map((user) => ({ user, activity: activity.get(user.id) ?? null }))
      .toSorted((a, b) => Number(b.activity?.online ?? false) - Number(a.activity?.online ?? false))
    return { items, total }
  }

  async ban(adminId: string, userId: string, hours: number | undefined, reason: string) {
    const duration = hours ? `${hours}h` : PERMANENT_BAN
    await this.directory.ban(userId, duration)
    await this.directory.forgetBan(userId)
    await this.audit.record(adminId, 'users.ban', userId, { hours: hours ?? null, reason })
  }

  async unban(adminId: string, userId: string) {
    await this.directory.unban(userId)
    await this.directory.forgetBan(userId)
    await this.repository.clearLock(userId)
    await this.audit.record(adminId, 'users.unban', userId)
  }

  async clearFlag(adminId: string, userId: string) {
    await this.repository.clearFlag(userId)
    await this.audit.record(adminId, 'security.clear', userId)
  }

  listAudit(page: number, perPage: number): Promise<{ rows: AuditRow[]; total: number }> {
    return this.repository.listAudit(page, perPage)
  }
}
