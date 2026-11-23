'use client'
import {
  BankPanelBankPanelUi,
  BankPanelQuestionDrawerUi,
  BankPanelQuestionFormModalUi,
} from '@/modules/admin-pages/components'
import { BankPanelModel } from '@/modules/admin-pages/hooks'
export function BankPanelContainer(
  ...args: Parameters<typeof BankPanelModel.useBankPanelContainer>
) {
  const props = BankPanelModel.useBankPanelContainer(...args)
  return <BankPanelBankPanelUi {...props} parts={BankPanelParts} />
}
export function QuestionDrawerContainer(
  ...args: Parameters<typeof BankPanelModel.useQuestionDrawerContainer>
) {
  const props = BankPanelModel.useQuestionDrawerContainer(...args)
  return <BankPanelQuestionDrawerUi {...props} parts={BankPanelParts} />
}
export function QuestionFormModalContainer(
  ...args: Parameters<typeof BankPanelModel.useQuestionFormModalContainer>
) {
  const props = BankPanelModel.useQuestionFormModalContainer(...args)
  return <BankPanelQuestionFormModalUi {...props} parts={BankPanelParts} />
}
export const BankPanelParts = {
  BankPanel: BankPanelContainer,
  QuestionDrawer: QuestionDrawerContainer,
  QuestionFormModal: QuestionFormModalContainer,
}
export default BankPanelContainer
