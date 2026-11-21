export interface CreditEvent {
  id: number
  kind: string
  tokens: number
  createdAt: Date
}

export interface CreditRepositoryPort {
  findBalance(userId: string): Promise<number | null>
  /** grants the welcome tokens once and returns the balance */
  claimWelcome(userId: string, tokens: number): Promise<number>
  /** moves the usage above `base` from the month's usage onto the balance */
  consume(userId: string, month: string, base: number): Promise<{ used: number; balance: number }>
  /** null when the receipt was already refunded or the daily refund limit is reached */
  refund(userId: string, month: string, receipt: string, tokens: number): Promise<number | null>
  sumGranted(userId: string): Promise<number>
  listEvents(userId: string, limit: number): Promise<CreditEvent[]>
}

export const CREDIT_REPOSITORY = Symbol('CREDIT_REPOSITORY')
