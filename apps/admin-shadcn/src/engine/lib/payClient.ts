import {
  billingFirstBonus,
  billingCreateOrder,
  billingGetOrder,
  billingCancelOrder,
} from '@/apis/billing/requests'

/** Các gói đã được thưởng lần đầu (lần sau nạp gói đó không còn thưởng). */
export async function boughtPacks(): Promise<number[]> {
  const j = await billingFirstBonus({})
  return Array.isArray(j.bonused) ? j.bonused : []
}

/** Tạo đơn nạp; trả link trang thanh toán PayOS. */
export type PaymentOrder = {
  orderCode: number
  checkoutUrl: string
  points: number
  vnd: number
  /** chuỗi VietQR để vẽ mã QR */
  qrCode: string
  /** mã ngân hàng (BIN Napas) của tài khoản nhận */
  bin: string
  accountNumber: string
  accountName: string
  /** nội dung chuyển khoản */
  description: string
  /** hết hạn (giây Unix) */
  expiresAt: number
}
export function createPayment(vnd: number) {
  return billingCreateOrder({ body: { vnd } })
}

/** huỷ đơn đang chờ (trả trạng thái sau khi huỷ: lỡ đã trả thì vẫn là 'paid') */
export function cancelPayment(orderCode: number) {
  return billingCancelOrder({ params: { path: { orderCode } } })
}

export type PayStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed'
export function paymentStatus(orderCode: number) {
  return billingGetOrder({ params: { path: { orderCode } } })
}
