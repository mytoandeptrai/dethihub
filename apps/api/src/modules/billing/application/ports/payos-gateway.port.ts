export const PAYOS_GATEWAY = Symbol('PAYOS_GATEWAY')

export interface CreateLinkInput {
  orderCode: number
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  /** Unix seconds */
  expiresAt: number
  itemName: string
}

export interface PayosLink {
  checkoutUrl: string
  paymentLinkId: string | null
  qrCode: string
  bin: string
  accountNumber: string
  accountName: string
  description: string
}

export interface PayosPaymentStatus {
  status: string
  /** As the gateway reported it; callers must validate */
  amountPaid: unknown
  reference: string | null
}

export interface PayosWebhook {
  orderCode: number
  /** Both layers of the payload said "00" */
  success: boolean
}

/** PayOS refused or could not create the payment link */
export class PayosRequestError extends Error {}

export interface PayosGatewayPort {
  isConfigured(): boolean
  createLink(input: CreateLinkInput): Promise<PayosLink>
  /** null when PayOS cannot answer right now */
  getStatus(orderCode: number): Promise<PayosPaymentStatus | null>
  /** Best effort: a refusal (money already arrived) is not an error */
  cancel(orderCode: number, reason: string): Promise<void>
  /** null when the signature does not match */
  parseWebhook(body: unknown): PayosWebhook | null
}
