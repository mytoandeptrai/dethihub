export const USER_DATA_REPOSITORY = Symbol('USER_DATA_REPOSITORY')

export interface UserDataRepositoryPort {
  /** Idempotent: removes or anonymizes everything this context keeps for the user; returns ids/keys the caller must clean up elsewhere */
  purge(userId: string): Promise<string[]>
}
