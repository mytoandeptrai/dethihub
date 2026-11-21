import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PAYMENT_ORDER_REPOSITORY } from '@/modules/billing/application/ports/payment-order.repository.port'
import {
  PAYOS_GATEWAY,
  PayosRequestError,
} from '@/modules/billing/application/ports/payos-gateway.port'
import { PaymentSettlementService } from '@/modules/billing/application/services/payment-settlement.service'
import { PricingService } from '@/modules/billing/application/services/pricing.service'
import { PaymentOrderStatus } from '@/modules/billing/domain/enums/order-status.enum'
import {
  isValidTopUpAmount,
  quoteOrder,
} from '@/modules/billing/domain/policies/order-quote.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { Env } from '@/app/config/env.schema'
import type { PaymentOrderRepositoryPort } from '@/modules/billing/application/ports/payment-order.repository.port'
import type { PayosGatewayPort } from '@/modules/billing/application/ports/payos-gateway.port'

const LINK_TTL_SECONDS = 15 * 60
/** A cancelled or expired order is still checked this long: the money may arrive after the window closes */
const RECHECK_CLOSED_MS = 48 * 3600 * 1000
const MAX_PENDING_TO_CANCEL = 20
/** Accounts not linked through PayOS accept at most 9 characters of transfer content */
const MAX_DESCRIPTION = 9

export interface CreatedOrder {
  orderCode: number
  checkoutUrl: string
  points: number
  vnd: number
  qrCode: string
  bin: string
  accountNumber: string
  accountName: string
  description: string
  expiresAt: number
}

export interface OrderView {
  orderCode: number
  status: string
  vnd: number
  points: number
}

@Injectable()
export class PaymentOrderService {
  constructor(
    @Inject(PAYMENT_ORDER_REPOSITORY) private readonly orders: PaymentOrderRepositoryPort,
    @Inject(PAYOS_GATEWAY) private readonly gateway: PayosGatewayPort,
    private readonly pricing: PricingService,
    private readonly settlement: PaymentSettlementService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(userId: string, vnd: number): Promise<CreatedOrder> {
    this.#requireConfigured()
    const pricing = await this.pricing.get()
    if (!isValidTopUpAmount(pricing, vnd)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Số tiền nạp từ ${pricing.minVnd.toLocaleString('vi-VN')}đ đến ${pricing.maxVnd.toLocaleString('vi-VN')}đ, bội số 1.000đ.`,
      })
    }

    // One open order per person: the older payment window is closed for good
    await this.#cancelPending(userId)
    const quote = quoteOrder(pricing, vnd, await this.orders.bonusedPacks(userId))
    const order = await this.orders.create({
      userId,
      vnd,
      points: quote.points,
      packVnd: quote.packVnd,
      bonusPoints: quote.bonusPoints,
    })

    const site = this.config.get('PUBLIC_SITE_URL', { infer: true }).replace(/\/+$/, '')
    const expiresAt = Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS
    try {
      const link = await this.gateway.createLink({
        orderCode: order.orderCode,
        amount: vnd,
        description: `DR${order.orderCode}`.slice(0, MAX_DESCRIPTION),
        returnUrl: `${site}/pricing?order=${order.orderCode}`,
        cancelUrl: `${site}/pricing?order=${order.orderCode}&cancelled=1`,
        expiresAt,
        itemName: `${quote.points} điểm AI`,
      })
      order.attachLink(link.checkoutUrl, link.paymentLinkId)
      await this.orders.save(order)
      return {
        orderCode: order.orderCode,
        checkoutUrl: link.checkoutUrl,
        points: quote.points,
        vnd,
        qrCode: link.qrCode,
        bin: link.bin,
        accountNumber: link.accountNumber,
        accountName: link.accountName,
        description: link.description,
        expiresAt,
      }
    } catch (error) {
      if (!(error instanceof PayosRequestError)) throw error
      order.fail()
      await this.orders.save(order)
      throw new BadGatewayException({
        code: ErrorCode.PAYMENT_GATEWAY_ERROR,
        message: 'Cổng thanh toán đang lỗi, thử lại sau ít phút.',
      })
    }
  }

  async get(userId: string, orderCode: number): Promise<OrderView> {
    this.#requireConfigured()
    let order = await this.#findOwned(userId, orderCode)
    const recentlyClosed =
      (order.status === PaymentOrderStatus.CANCELLED ||
        order.status === PaymentOrderStatus.EXPIRED) &&
      Date.now() - order.createdAt.getTime() < RECHECK_CLOSED_MS
    if (order.isPending || recentlyClosed) {
      const status = await this.settlement.reconcile(orderCode)
      if (status && status !== 'PENDING' && status !== 'PROCESSING') {
        order = await this.#findOwned(userId, orderCode)
      }
    }
    return this.#view(order)
  }

  async cancel(userId: string, orderCode: number): Promise<OrderView> {
    this.#requireConfigured()
    const order = await this.#findOwned(userId, orderCode)
    if (order.isPending) await this.settlement.cancel(orderCode)
    return this.get(userId, orderCode)
  }

  bonusedPacks(userId: string): Promise<number[]> {
    return this.orders.bonusedPacks(userId)
  }

  async #cancelPending(userId: string): Promise<void> {
    const pending = await this.orders.findPending(userId, MAX_PENDING_TO_CANCEL)
    await Promise.allSettled(pending.map((order) => this.settlement.cancel(order.orderCode)))
  }

  async #findOwned(userId: string, orderCode: number) {
    const order = await this.orders.findOwned(orderCode, userId)
    if (!order) {
      throw new NotFoundException({
        code: ErrorCode.ORDER_NOT_FOUND,
        message: 'Không tìm thấy đơn nạp.',
      })
    }
    return order
  }

  #view(order: { orderCode: number; status: string; vnd: number; points: number }): OrderView {
    return {
      orderCode: order.orderCode,
      status: order.status,
      vnd: order.vnd,
      points: order.points,
    }
  }

  #requireConfigured(): void {
    if (!this.gateway.isConfigured()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.PAYMENT_NOT_CONFIGURED,
        message: 'Thanh toán chưa mở, bạn quay lại sau nhé.',
      })
    }
  }
}
