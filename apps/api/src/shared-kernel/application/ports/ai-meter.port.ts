export const AI_METER = Symbol('AI_METER')

/** AI usage is metered in tokens; one point is this many tokens */
export const TOKENS_PER_POINT = 1000

export interface AiQuotaView {
  used: number
  limit: number
  scope: 'month'
  base?: number
  credits?: number
}

/** Tokens held for one AI call; exactly one of settle or release ends it */
export interface AiHold {
  /** null = unlimited account */
  quota: AiQuotaView | null
  /** Charges the real tokens, then releases the hold */
  settle(tokens: number): Promise<AiQuotaView | null>
  /** Gives the hold back without charging; safe to call repeatedly */
  release(): Promise<void>
}

export interface AiHoldDenied {
  denied: true
  /** true = other in-flight calls hold the remaining points; false = not enough points */
  busy: boolean
  message: string
  quota: AiQuotaView | null
}

/** A finished call outside chat (an image) that should show up in the AI call log */
export interface AiCallNote {
  provider: string
  model: string
  kind: string
  /** tokens charged to the user */
  billed: number
  ms: number
}

export interface AiMeterPort {
  /** `shortfall` words the refusal when the user has points left but fewer than needed */
  hold(
    userId: string,
    tokens: number,
    shortfall: (neededPoints: string, leftPoints: string) => string,
  ): Promise<AiHold | AiHoldDenied>
  /** Best-effort: never throws */
  record(userId: string, call: AiCallNote): Promise<void>
}
