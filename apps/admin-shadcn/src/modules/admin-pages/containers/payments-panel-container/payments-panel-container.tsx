'use client'
import {
  PaymentsPanelDeltaUi,
  PaymentsPanelMonthlyRevenueUi,
  PaymentsPanelPaymentDrawerUi,
  PaymentsPanelPaymentsPanelUi,
  PaymentsPanelRowUi,
} from '@/modules/admin-pages/components'
import { PaymentsPanelModel } from '@/modules/admin-pages/hooks'
export function DeltaContainer(...args: Parameters<typeof PaymentsPanelModel.useDeltaContainer>) {
  const props = PaymentsPanelModel.useDeltaContainer(...args)
  return <PaymentsPanelDeltaUi {...props} parts={PaymentsPanelParts} />
}
export function MonthlyRevenueContainer(
  ...args: Parameters<typeof PaymentsPanelModel.useMonthlyRevenueContainer>
) {
  const props = PaymentsPanelModel.useMonthlyRevenueContainer(...args)
  return <PaymentsPanelMonthlyRevenueUi {...props} parts={PaymentsPanelParts} />
}
export function PaymentsPanelContainer(
  ...args: Parameters<typeof PaymentsPanelModel.usePaymentsPanelContainer>
) {
  const props = PaymentsPanelModel.usePaymentsPanelContainer(...args)
  return <PaymentsPanelPaymentsPanelUi {...props} parts={PaymentsPanelParts} />
}
export function RowContainer(...args: Parameters<typeof PaymentsPanelModel.useRowContainer>) {
  const props = PaymentsPanelModel.useRowContainer(...args)
  return <PaymentsPanelRowUi {...props} parts={PaymentsPanelParts} />
}
export function PaymentDrawerContainer(
  ...args: Parameters<typeof PaymentsPanelModel.usePaymentDrawerContainer>
) {
  const props = PaymentsPanelModel.usePaymentDrawerContainer(...args)
  return <PaymentsPanelPaymentDrawerUi {...props} parts={PaymentsPanelParts} />
}
export const PaymentsPanelParts = {
  Delta: DeltaContainer,
  MonthlyRevenue: MonthlyRevenueContainer,
  PaymentsPanel: PaymentsPanelContainer,
  Row: RowContainer,
  PaymentDrawer: PaymentDrawerContainer,
}
export default PaymentsPanelContainer
