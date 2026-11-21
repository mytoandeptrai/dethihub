import type { PaymentOrder } from '@/modules/billing/domain/aggregates/payment-order.aggregate'

export interface NewPaymentOrder {
  userId: string
  vnd: number
  points: number
  packVnd: number | null
  bonusPoints: number
}

export type SettleOutcome = 'ok' | 'already' | 'missing' | 'unknown_amount' | 'underpaid'

export interface PaymentOrderRepositoryPort {
  create(draft: NewPaymentOrder): Promise<PaymentOrder>
  findByCode(orderCode: number): Promise<PaymentOrder | null>
  findOwned(orderCode: number, userId: string): Promise<PaymentOrder | null>
  findPending(userId: string, limit: number): Promise<PaymentOrder[]>
  /** Writes status and link of an order that is still pending; false when it left pending meanwhile */
  save(order: PaymentOrder): Promise<boolean>
  /** Packs whose first-purchase bonus the user already earned */
  bonusedPacks(userId: string): Promise<number[]>
  /** Turns an unpaid order into a plain top-up of the amount really received */
  convertToBase(orderCode: number, paidVnd: number, points: number): Promise<boolean>
  /** Marks the order paid and grants its points in one transaction; repeating it grants nothing */
  settle(orderCode: number, paid: number | null, reference: string): Promise<SettleOutcome>
}

export const PAYMENT_ORDER_REPOSITORY = Symbol('PAYMENT_ORDER_REPOSITORY')
