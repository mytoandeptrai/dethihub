'use client'
import { OpsPanelOpsPanelUi } from '@/modules/admin-pages/components/ops-panel-ui'
import { OpsPanelModel } from '@/modules/admin-pages/hooks'
export function OpsPanelContainer(...args: Parameters<typeof OpsPanelModel.useOpsPanelContainer>) {
  const props = OpsPanelModel.useOpsPanelContainer(...args)
  return <OpsPanelOpsPanelUi {...props} parts={OpsPanelParts} />
}
export const OpsPanelParts = { OpsPanel: OpsPanelContainer }
export default OpsPanelContainer
