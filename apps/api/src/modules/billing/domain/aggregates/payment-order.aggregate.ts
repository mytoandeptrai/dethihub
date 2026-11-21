import { PaymentOrderStatus } from '@/modules/billing/domain/enums/order-status.enum'

import type { PaymentOrderStatus as Status } from '@/modules/billing/domain/enums/order-status.enum'

export interface PaymentOrderProps {
  orderCode: number
  userId: string
  vnd: number
  points: number
  packVnd: number | null
  bonusPoints: number
  status: Status
  paymentLinkId: string | null
  checkoutUrl: string | null
  reference: string | null
  createdAt: Date
  paidAt: Date | null
}

/** Only a pending order changes state here; paying goes through the repository's atomic settle */
export class PaymentOrder {
  readonly #props: PaymentOrderProps

  private constructor(props: PaymentOrderProps) {
    this.#props = { ...props }
  }

  static reconstitute(props: PaymentOrderProps): PaymentOrder {
    return new PaymentOrder(props)
  }

  get orderCode(): number {
    return this.#props.orderCode
  }
  get userId(): string {
    return this.#props.userId
  }
  get vnd(): number {
    return this.#props.vnd
  }
  get points(): number {
    return this.#props.points
  }
  get packVnd(): number | null {
    return this.#props.packVnd
  }
  get bonusPoints(): number {
    return this.#props.bonusPoints
  }
  get status(): Status {
    return this.#props.status
  }
  get paymentLinkId(): string | null {
    return this.#props.paymentLinkId
  }
  get checkoutUrl(): string | null {
    return this.#props.checkoutUrl
  }
  get createdAt(): Date {
    return this.#props.createdAt
  }

  get isPending(): boolean {
    return this.#props.status === PaymentOrderStatus.PENDING
  }

  attachLink(checkoutUrl: string, paymentLinkId: string | null): void {
    this.#requirePending('attach a payment link to')
    this.#props.checkoutUrl = checkoutUrl
    this.#props.paymentLinkId = paymentLinkId
  }

  fail(): void {
    this.#requirePending('fail')
    this.#props.status = PaymentOrderStatus.FAILED
  }

  close(status: typeof PaymentOrderStatus.CANCELLED | typeof PaymentOrderStatus.EXPIRED): void {
    this.#requirePending('close')
    this.#props.status = status
  }

  #requirePending(action: string): void {
    if (!this.isPending) {
      throw new Error(`Cannot ${action} an order in status ${this.#props.status}`)
    }
  }
}
