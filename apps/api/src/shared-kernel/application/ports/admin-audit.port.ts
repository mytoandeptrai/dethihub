export const ADMIN_AUDIT = Symbol('ADMIN_AUDIT')

export interface AdminAuditPort {
  /** Best-effort: never throws, a failed audit write must not fail the admin action */
  record(
    actorId: string | null,
    action: string,
    target: string,
    detail?: Record<string, unknown>,
  ): Promise<void>
}
