import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { UserDeletionRequestedEvent } from '@/modules/access-control/domain/events/user-deletion-requested.event'
import { USER_DATA_REPOSITORY } from '@/modules/exam/application/ports/user-data.repository.port'
import { examRowCacheKey } from '@/modules/exam/application/services/exam-query.service'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'

import type { UserDataRepositoryPort } from '@/modules/exam/application/ports/user-data.repository.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'

@Injectable()
export class UserDeletionListener {
  constructor(
    @Inject(USER_DATA_REPOSITORY) private readonly userData: UserDataRepositoryPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  // Errors must reach the deleting admin, otherwise the account would be removed with data left behind
  @OnEvent(UserDeletionRequestedEvent.name, { suppressErrors: false })
  async handle(event: UserDeletionRequestedEvent): Promise<void> {
    const examIds = await this.userData.purge(event.userId)
    await Promise.all(examIds.map((id) => this.cache.del(examRowCacheKey(id))))
  }
}
