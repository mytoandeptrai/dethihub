import { DomainEvent } from '@/shared-kernel/domain/events'

/** Fired after the account is banned and before the auth user is removed; every context purges its own rows */
export class UserDeletionRequestedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super()
  }
}
