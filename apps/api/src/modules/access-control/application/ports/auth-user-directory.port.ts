export const AUTH_USER_DIRECTORY = Symbol('AUTH_USER_DIRECTORY')

export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSignInAt: string | null
  bannedUntil: string | null
}

export interface AuthUserDirectoryPort {
  isBanned(userId: string, options?: { fresh?: boolean }): Promise<boolean>
  forgetBan(userId: string): Promise<void>
  getUser(userId: string): Promise<AuthUser | null>
  /** `query` is matched by the auth server against email and name over all accounts */
  listUsers(
    page: number,
    perPage: number,
    query?: string,
  ): Promise<{ users: AuthUser[]; total: number }>
  ban(userId: string, duration: string): Promise<void>
  unban(userId: string): Promise<void>
  deleteUser(userId: string): Promise<void>
}
