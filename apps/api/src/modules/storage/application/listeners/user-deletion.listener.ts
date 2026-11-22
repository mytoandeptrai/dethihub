import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { UserDeletionRequestedEvent } from '@/modules/access-control/domain/events/user-deletion-requested.event'
import { OBJECT_STORAGE } from '@/modules/object-storage/application/ports/object-storage.port'
import { USER_DATA_REPOSITORY } from '@/modules/storage/application/ports/user-data.repository.port'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'

import type { ObjectStoragePort } from '@/modules/object-storage/application/ports/object-storage.port'
import type { UserDataRepositoryPort } from '@/modules/storage/application/ports/user-data.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

const MAX_AUDITED_KEYS = 50

@Injectable()
export class UserDeletionListener {
  readonly #logger = new Logger(UserDeletionListener.name)

  constructor(
    @Inject(USER_DATA_REPOSITORY) private readonly userData: UserDataRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
  ) {}

  // Errors must reach the deleting admin, otherwise the account would be removed with data left behind
  @OnEvent(UserDeletionRequestedEvent.name, { suppressErrors: false })
  async handle(event: UserDeletionRequestedEvent): Promise<void> {
    const { documentKeys, imageKeys } = await this.userData.purge(event.userId)
    // The rows are already gone; a file that cannot be deleted is only logged
    await Promise.all(
      documentKeys.map((key) =>
        this.storage.delete(key).catch((error: unknown) => {
          this.#logger.warn(`could not delete ${key}: ${String(error)}`)
        }),
      ),
    )
    const failedImages: string[] = []
    await Promise.all(
      imageKeys.map((key) =>
        this.storage.delete(key).catch((error: unknown) => {
          this.#logger.warn(`could not delete ${key}: ${String(error)}`)
          failedImages.push(key)
        }),
      ),
    )
    if (failedImages.length > 0) {
      await this.audit.record(event.adminId, 'users.delete.images_failed', event.userId, {
        email: event.email,
        count: failedImages.length,
        keys: failedImages.slice(0, MAX_AUDITED_KEYS),
      })
    }
  }
}
