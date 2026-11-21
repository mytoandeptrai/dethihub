import type { RevenueRange } from '@/modules/billing/domain/policies/revenue.policy'

export const PAYMENT_ADMIN_REPOSITORY = Symbol('PAYMENT_ADMIN_REPOSITORY')

export const PAYMENT_FILTERS = ['all', 'pending', 'paid', 'closed', 'attention'] as const

export type PaymentFilter = (typeof PAYMENT_FILTERS)[number]

export interface AdminPaymentRow {
  orderCode: number
  userId: string
  vnd: number
  points: number
  bonusPoints: number
  status: string
  reference: string | null
  createdAt: Date
  paidAt: Date | null
}

export interface RevenueSlot {
  vnd: number
  count: number
}

export interface MonthlyRevenue extends RevenueSlot {
  month: string
}

export interface PaymentAdminRepositoryPort {
  list(
    filter: PaymentFilter,
    orderCode: number | null,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminPaymentRow[]; total: number }>
  /** Paid orders summed per range, in the order given */
  revenue(ranges: RevenueRange[]): Promise<RevenueSlot[]>
  /** Paid orders per Vietnam-time month, newest first */
  monthlyRevenue(months: number): Promise<MonthlyRevenue[]>
}
