export const ADMIN_AUDIT_REPOSITORY = Symbol('ADMIN_AUDIT_REPOSITORY')

export interface AdminAuditEntry {
  adminId: string | null
  action: string
  target: string
  detail: Record<string, unknown>
}

export interface AdminAuditRepositoryPort {
  record(entry: AdminAuditEntry): Promise<void>
}
