import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { basePoints } from '@workspace/core'

import { PAYMENT_ORDER_REPOSITORY } from '@/modules/billing/application/ports/payment-order.repository.port'
import { PAYOS_GATEWAY } from '@/modules/billing/application/ports/payos-gateway.port'
import { PricingService } from '@/modules/billing/application/services/pricing.service'
import { PaymentOrderStatus } from '@/modules/billing/domain/enums/order-status.enum'
import { parseAmount } from '@/modules/billing/domain/policies/settlement.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { PaymentOrderRepositoryPort } from '@/modules/billing/application/ports/payment-order.repository.port'
import type { PayosGatewayPort } from '@/modules/billing/application/ports/payos-gateway.port'

const FALLBACK_REFERENCE = 'tra-cuu'

@Injectable()
export class PaymentSettlementService {
  constructor(
    @Inject(PAYMENT_ORDER_REPOSITORY) private readonly orders: PaymentOrderRepositoryPort,
    @Inject(PAYOS_GATEWAY) private readonly gateway: PayosGatewayPort,
    private readonly pricing: PricingService,
  ) {}

  /**
   * Asks PayOS about an order and acts on the answer: paid credits the points once,
   * cancelled or expired closes the order. Returns the PayOS status, or undefined when PayOS cannot answer.
   */
  async reconcile(orderCode: number): Promise<string | undefined> {
    const answer = await this.gateway.getStatus(orderCode)
    if (!answer) return undefined
    const paid = parseAmount(answer.amountPaid)
    const reference = answer.reference ?? FALLBACK_REFERENCE

    if (answer.status === 'PAID' || answer.status === 'UNDERPAID') {
      await this.#credit(orderCode, paid, reference)
    } else if (answer.status === 'CANCELLED' || answer.status === 'EXPIRED') {
      await this.#close(
        orderCode,
        answer.status === 'CANCELLED' ? PaymentOrderStatus.CANCELLED : PaymentOrderStatus.EXPIRED,
      )
      // Money can arrive before the link closes: a closed order that was paid still credits
      if (paid) await this.#credit(orderCode, paid, reference)
    }
    return answer.status
  }

  /** Withdraws the PayOS link, then checks once more in case the money had already arrived */
  async cancel(orderCode: number): Promise<string | undefined> {
    await this.gateway.cancel(orderCode, 'Người dùng huỷ')
    return this.reconcile(orderCode)
  }

  /** The webhook is only a signal: the amount is read from PayOS, never from the request body */
  async handleWebhook(body: unknown): Promise<void> {
    if (!this.gateway.isConfigured()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.PAYMENT_NOT_CONFIGURED,
        message: 'not configured',
      })
    }
    const hook = this.gateway.parseWebhook(body)
    if (!hook) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'invalid signature',
      })
    }
    // PayOS sends sample data without a real order when the URL is saved: answer 200 and do nothing
    if (!hook.success || !(await this.orders.findByCode(hook.orderCode))) return
    if (!(await this.reconcile(hook.orderCode))) {
      throw new InternalServerErrorException({
        code: ErrorCode.PAYMENT_GATEWAY_ERROR,
        message: 'retry',
      })
    }
  }

  async #close(
    orderCode: number,
    status: typeof PaymentOrderStatus.CANCELLED | typeof PaymentOrderStatus.EXPIRED,
  ): Promise<void> {
    const order = await this.orders.findByCode(orderCode)
    if (!order?.isPending) return
    order.close(status)
    await this.orders.save(order)
  }

  async #credit(orderCode: number, paid: number | null, reference: string): Promise<void> {
    const outcome = await this.orders.settle(orderCode, paid, reference)
    if (outcome === 'underpaid' && paid) await this.#creditShortPayment(orderCode, paid, reference)
  }

  /**
   * A short payment becomes a plain top-up of the amount received: the link is closed so no more
   * money arrives, the order is rewritten to the base price (no pack bonus), then credited.
   */
  async #creditShortPayment(orderCode: number, paid: number, reference: string): Promise<void> {
    const order = await this.orders.findByCode(orderCode)
    if (!order || order.status === PaymentOrderStatus.PAID || paid >= order.vnd) return
    const points = basePoints(await this.pricing.get(), paid)
    // Less than one point: leave the SHORT note for an admin to resolve
    if (points < 1) return
    await this.gateway.cancel(orderCode, 'Chuyển thiếu')
    if (!(await this.orders.convertToBase(orderCode, paid, points))) return
    await this.orders.settle(orderCode, paid, `THIEU ${paid}d/${order.vnd}d ${reference}`)
  }
}
