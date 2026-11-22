import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { DomainEventPublisher } from '@/app/events/domain-event-publisher'
import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'
import { UserDeletionRequestedEvent } from '@/modules/access-control/domain/events/user-deletion-requested.event'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthUserDirectoryPort } from '@/modules/access-control/application/ports/auth-user-directory.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

const PERMANENT_BAN = '876000h'

@Injectable()
export class UserDeletionService {
  constructor(
    @Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectoryPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    private readonly events: DomainEventPublisher,
  ) {}

  /**
   * Order matters: audit first, ban so the account is unusable while data is purged, purge every
   * context, delete the auth user last. A failure leaves the account banned and the call can be repeated.
   */
  async delete(adminId: string, userId: string, confirmEmail: string): Promise<void> {
    const user = await this.directory.getUser(userId)
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'Không tìm thấy tài khoản.',
      })
    }
    if (confirmEmail.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Email xác nhận không khớp.',
      })
    }

    await this.audit.record(adminId, 'users.delete', userId, { email: user.email })
    try {
      await this.directory.ban(userId, PERMANENT_BAN)
      await this.directory.forgetBan(userId)
      await this.events.publish(new UserDeletionRequestedEvent(userId, adminId, user.email ?? null))
      await this.directory.deleteUser(userId)
    } catch (error) {
      await this.audit.record(adminId, 'users.delete.failed', userId, { error: String(error) })
      throw new BadGatewayException({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Không xoá được tài khoản, thử lại sau.',
      })
    }
  }
}
