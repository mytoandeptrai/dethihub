'use client'
import { BankAiPanelBankAiPanelUi } from '@/modules/admin-pages/components/bank-ai-panel-ui'
import { BankAiPanelModel } from '@/modules/admin-pages/hooks'
export function BankAiPanelContainer(
  ...args: Parameters<typeof BankAiPanelModel.useBankAiPanelContainer>
) {
  const props = BankAiPanelModel.useBankAiPanelContainer(...args)
  return <BankAiPanelBankAiPanelUi {...props} parts={BankAiPanelParts} />
}
export const BankAiPanelParts = { BankAiPanel: BankAiPanelContainer }
export default BankAiPanelContainer
