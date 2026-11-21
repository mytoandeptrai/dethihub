export const CREDIT_GRANT = Symbol('CREDIT_GRANT')

declare const transactionBrand: unique symbol

/** A database transaction opened by the caller; only the implementing context looks inside */
export interface TxContext {
  readonly [transactionBrand]: true
}

export interface CreditGrantPort {
  /** Adds tokens to the user's balance and records the event inside the caller's transaction */
  grant(tx: TxContext, userId: string, tokens: number, kind: string): Promise<void>
}
