'use client'
import { PricingEditorPricingEditorUi } from '@/modules/admin-pages/components/pricing-editor-ui'
import { PricingEditorModel } from '@/modules/admin-pages/hooks'
export function PricingEditorContainer(
  ...args: Parameters<typeof PricingEditorModel.usePricingEditorContainer>
) {
  const props = PricingEditorModel.usePricingEditorContainer(...args)
  return <PricingEditorPricingEditorUi {...props} parts={PricingEditorParts} />
}
export const PricingEditorParts = { PricingEditor: PricingEditorContainer }
export default PricingEditorContainer
