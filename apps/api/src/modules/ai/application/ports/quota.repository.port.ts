export interface QuotaOverride {
  monthlyTokens: number | null
  note: string | null
}

export interface QuotaRepositoryPort {
  findOverride(userId: string): Promise<QuotaOverride | null>
  findUsedTokens(userId: string, month: string): Promise<number>
  findRequests(userId: string, month: string): Promise<number>
  /** monthlyTokens null = unlimited */
  upsertOverride(userId: string, monthlyTokens: number | null, note: string | null): Promise<void>
  deleteOverride(userId: string): Promise<void>
  /** false when the tokens already used plus those held by other in-flight calls reach the limit */
  reserve(userId: string, month: string, limit: number, amount: number): Promise<boolean>
  release(userId: string, month: string, amount: number): Promise<void>
  /** returns the month's used tokens after adding */
  addUsage(userId: string, month: string, tokens: number): Promise<number>
}

export const QUOTA_REPOSITORY = Symbol('QUOTA_REPOSITORY')
