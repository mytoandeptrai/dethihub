export const ADMIN_USER_REPOSITORY = Symbol('ADMIN_USER_REPOSITORY')

export interface UserActivity {
  userId: string
  docs: number
  decks: number
  tokensThisMonth: number
  role: string | null
  strikes: number | null
  lockedUntil: Date | null
  lastAction: string | null
  online: boolean
}

export interface AuditRow {
  id: string
  adminId: string | null
  action: string
  target: string | null
  detail: unknown
  createdAt: Date
}

export interface AdminUserRepositoryPort {
  activityOf(userIds: string[]): Promise<UserActivity[]>
  clearLock(userId: string): Promise<void>
  clearFlag(userId: string): Promise<void>
  listAudit(page: number, perPage: number): Promise<{ rows: AuditRow[]; total: number }>
}
