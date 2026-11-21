import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'

import { PAYMENT_ADMIN_REPOSITORY } from '@/modules/billing/application/ports/payment-admin.repository.port'
import { PAYMENT_ORDER_REPOSITORY } from '@/modules/billing/application/ports/payment-order.repository.port'
import { PAYOS_GATEWAY } from '@/modules/billing/application/ports/payos-gateway.port'
import { PaymentSettlementService } from '@/modules/billing/application/services/payment-settlement.service'
import { PaymentOrderStatus } from '@/modules/billing/domain/enums/order-status.enum'
import {
  REVENUE_KEYS,
  STALE_PENDING_MS,
  revenueRanges,
} from '@/modules/billing/domain/policies/revenue.policy'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  AdminPaymentRow,
  MonthlyRevenue,
  PaymentAdminRepositoryPort,
  PaymentFilter,
  RevenueSlot,
} from '@/modules/billing/application/ports/payment-admin.repository.port'
import type { PaymentOrderRepositoryPort } from '@/modules/billing/application/ports/payment-order.repository.port'
import type { PayosGatewayPort } from '@/modules/billing/application/ports/payos-gateway.port'
import type { RevenueKey } from '@/modules/billing/domain/policies/revenue.policy'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { UserProfileLookupPort } from '@/shared-kernel/application/ports/user-profile-lookup.port'

const MONTHS_SHOWN = 12
const MAX_NOTE = 100
const MAX_REFERENCE = 120

export interface PaymentView {
  payment: AdminPaymentRow
  email: string | null
  attention: boolean
}

export type RevenueView = Record<RevenueKey, RevenueSlot> & { months: MonthlyRevenue[] }

const bad = (message: string) => new BadRequestException({ code: ErrorCode.BAD_REQUEST, message })

@Injectable()
export class PaymentAdminService {
  constructor(
    @Inject(PAYMENT_ADMIN_REPOSITORY) private readonly repository: PaymentAdminRepositoryPort,
    @Inject(PAYMENT_ORDER_REPOSITORY) private readonly orders: PaymentOrderRepositoryPort,
    @Inject(PAYOS_GATEWAY) private readonly gateway: PayosGatewayPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    @Inject(USER_PROFILE_LOOKUP) private readonly users: UserProfileLookupPort,
    private readonly settlement: PaymentSettlementService,
  ) {}

  get configured(): boolean {
    return this.gateway.isConfigured()
  }

  async list(
    filter: PaymentFilter,
    orderCode: number | null,
    page: number,
    perPage: number,
  ): Promise<{ items: PaymentView[]; total: number }> {
    const { rows, total } = await this.repository.list(filter, orderCode, page, perPage)
    const contacts = await this.users
      .getContacts(rows.map((row) => row.userId))
      .catch(() => new Map())
    const items = rows.map((payment) => ({
      payment,
      email: contacts.get(payment.userId)?.email ?? null,
      attention: needsAttention(payment),
    }))
    return { items, total }
  }

  /** Not tied to the list filter: the totals always cover every paid order */
  async revenue(): Promise<RevenueView> {
    const ranges = revenueRanges()
    const [slots, months] = await Promise.all([
      this.repository.revenue(ranges),
      this.repository.monthlyRevenue(MONTHS_SHOWN),
    ])
    const byKey = Object.fromEntries(
      REVENUE_KEYS.map((key) => [key, slots[ranges.findIndex((range) => range.key === key)]]),
    ) as Record<RevenueKey, RevenueSlot>
    return { ...byKey, months }
  }

  /** Asks PayOS about an order that was not settled (lost webhook): paid credits it, cancelled or expired closes it */
  async sync(orderCode: number): Promise<{ payos: string | null; status: string }> {
    if (!this.gateway.isConfigured()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.PAYMENT_NOT_CONFIGURED,
        message: 'Chưa cấu hình PayOS.',
      })
    }
    await this.#find(orderCode)
    const payos = await this.settlement.reconcile(orderCode).catch(() => null)
    return { payos: payos ?? null, status: (await this.#find(orderCode)).status }
  }

  /** Credits an order by hand after the bank statement showed the money arrived but PayOS could not match it */
  async credit(adminId: string, orderCode: number, rawNote: string): Promise<void> {
    const note = rawNote.trim().slice(0, MAX_NOTE)
    if (!note) throw bad('Cần ghi chú lý do (vd mã giao dịch ngân hàng).')
    const order = await this.#find(orderCode)
    if (order.status === PaymentOrderStatus.PAID) throw bad('Đơn này đã được cộng điểm.')

    const outcome = await this.orders.settle(
      orderCode,
      order.vnd,
      `TAY ${note}`.slice(0, MAX_REFERENCE),
    )
    if (outcome !== 'ok') {
      throw new BadGatewayException({
        code: ErrorCode.PAYMENT_GATEWAY_ERROR,
        message: `Không cộng được (${outcome}).`,
      })
    }
    await this.audit.record(adminId, 'payments.credit', order.userId, {
      orderCode,
      vnd: order.vnd,
      points: order.points,
      note,
    })
  }

  async #find(orderCode: number) {
    const order = await this.orders.findByCode(orderCode)
    if (!order) {
      throw new NotFoundException({
        code: ErrorCode.ORDER_NOT_FOUND,
        message: 'Không tìm thấy đơn.',
      })
    }
    return order
  }
}

function needsAttention(payment: AdminPaymentRow): boolean {
  if (payment.status === 'paid') return false
  const stalePending =
    payment.status === 'pending' && Date.now() - payment.createdAt.getTime() > STALE_PENDING_MS
  return Boolean(payment.reference?.startsWith('THIEU')) || stalePending
}
