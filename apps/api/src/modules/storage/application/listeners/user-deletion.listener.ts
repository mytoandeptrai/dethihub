import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { UserDeletionRequestedEvent } from '@/modules/access-control/domain/events/user-deletion-requested.event'
import { OBJECT_STORAGE } from '@/modules/object-storage/application/ports/object-storage.port'
import { USER_DATA_REPOSITORY } from '@/modules/storage/application/ports/user-data.repository.port'

import type { ObjectStoragePort } from '@/modules/object-storage/application/ports/object-storage.port'
import type { UserDataRepositoryPort } from '@/modules/storage/application/ports/user-data.repository.port'

@Injectable()
export class UserDeletionListener {
  readonly #logger = new Logger(UserDeletionListener.name)

  constructor(
    @Inject(USER_DATA_REPOSITORY) private readonly userData: UserDataRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
  ) {}

  // Errors must reach the deleting admin, otherwise the account would be removed with data left behind
  @OnEvent(UserDeletionRequestedEvent.name, { suppressErrors: false })
  async handle(event: UserDeletionRequestedEvent): Promise<void> {
    const keys = await this.userData.purge(event.userId)
    // The rows are already gone; a file that cannot be deleted is only logged
    await Promise.all(
      keys.map((key) =>
        this.storage.delete(key).catch((error: unknown) => {
          this.#logger.warn(`could not delete ${key}: ${String(error)}`)
        }),
      ),
    )
  }
}
