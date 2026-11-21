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

export interface AiCallLogRepositoryPort {
  log(call: AiCallRecord): Promise<void>
  /** failed calls of the last 24 hours that left the user with nothing (empty answer, broken stream), counted up to `limit` */
  countRecentFreeFails(userId: string, limit: number): Promise<number>
}

export const AI_CALL_LOG_REPOSITORY = Symbol('AI_CALL_LOG_REPOSITORY')
