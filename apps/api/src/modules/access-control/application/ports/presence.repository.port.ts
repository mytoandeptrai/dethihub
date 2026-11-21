export const PRESENCE_REPOSITORY = Symbol('PRESENCE_REPOSITORY')

export interface PresenceRepositoryPort {
  /** Marks the user as seen now */
  touch(userId: string): Promise<void>
}
