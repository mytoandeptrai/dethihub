export interface AiCallRecord {
  userId: string
  model: string
  provider: string
  ok: boolean
  error: string | null
  promptTokens: number
  completionTokens: number
  cost: number | null
  ms: number
}

export interface AiCallStatsRow {
  day: string
  model: string
  provider: string
  calls: number
  errors: number
  tokens: number
  cost: number | null
  avgMs: number
}

export interface AiCallErrorRow {
  id: number
  userId: string | null
  model: string
  provider: string
  error: string | null
  ms: number
  createdAt: Date
}

export interface AiCallLogRepositoryPort {
  log(call: AiCallRecord): Promise<void>
  /** failed calls of the last 24 hours that left the user with nothing (empty answer, broken stream), counted up to `limit` */
  countRecentFreeFails(userId: string, limit: number): Promise<number>
  /** same count for several users, without a limit */
  countRecentFreeFailsByUser(userIds: string[]): Promise<Map<string, number>>
  /** per Asia/Ho_Chi_Minh day, model and provider, for the last `days` days */
  stats(days: number): Promise<AiCallStatsRow[]>
  listErrors(limit: number): Promise<AiCallErrorRow[]>
}

export const AI_CALL_LOG_REPOSITORY = Symbol('AI_CALL_LOG_REPOSITORY')
