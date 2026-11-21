import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { USER_DATA_REPOSITORY } from '@/modules/workspace/application/ports/user-data.repository.port'
import { UserDeletionRequestedEvent } from '@/modules/access-control/domain/events/user-deletion-requested.event'

import type { UserDataRepositoryPort } from '@/modules/workspace/application/ports/user-data.repository.port'

@Injectable()
export class UserDeletionListener {
  constructor(@Inject(USER_DATA_REPOSITORY) private readonly userData: UserDataRepositoryPort) {}

  // Errors must reach the deleting admin, otherwise the account would be removed with data left behind
  @OnEvent(UserDeletionRequestedEvent.name, { suppressErrors: false })
  async handle(event: UserDeletionRequestedEvent): Promise<void> {
    await this.userData.purge(event.userId)
  }
}
