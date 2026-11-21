export const BANK_QUESTION_REPOSITORY = Symbol('BANK_QUESTION_REPOSITORY')

export type BankStatus = 'published' | 'hidden'

export interface BankRow {
  id: string
  data: unknown
  status: BankStatus
  updatedAt: Date | null
  updatedBy: string | null
}

export interface BankQuestionRepositoryPort {
  /** Newest first */
  list(): Promise<BankRow[]>
  /** Whole-row upsert */
  save(
    id: string,
    data: Record<string, unknown>,
    status: BankStatus,
    adminId: string,
  ): Promise<void>
  /** Hides an existing row keeping its data; a missing row is created from `entry` */
  hide(id: string, entry: Record<string, unknown>, adminId: string): Promise<void>
  unhide(id: string, adminId: string): Promise<void>
  /** Drops the override: a static question returns to its original, a `db-` one disappears */
  delete(id: string): Promise<void>
}
