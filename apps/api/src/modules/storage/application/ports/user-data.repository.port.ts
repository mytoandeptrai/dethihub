export const USER_DATA_REPOSITORY = Symbol('USER_DATA_REPOSITORY')

export interface PurgedKeys {
  documentKeys: string[]
  imageKeys: string[]
}

export interface UserDataRepositoryPort {
  /** Idempotent: removes everything this context keeps for the user; returns the stored object keys no remaining row points to */
  purge(userId: string): Promise<PurgedKeys>
}
