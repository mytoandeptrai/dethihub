export const USER_DATA_REPOSITORY = Symbol('USER_DATA_REPOSITORY')

export interface UserDataRepositoryPort {
  /** Idempotent: removes or anonymizes everything this context keeps for the user */
  purge(userId: string): Promise<void>
}
