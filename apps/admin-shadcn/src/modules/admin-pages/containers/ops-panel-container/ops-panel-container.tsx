'use client'
import { PageSkeleton } from '@/components/page-skeleton'
import { OpsPanelOpsPanelUi } from '@/modules/admin-pages/components/ops-panel-ui'
import { OpsPanelModel } from '@/modules/admin-pages/hooks'
export function OpsPanelContainer(...args: Parameters<typeof OpsPanelModel.useOpsPanelContainer>) {
  const props = OpsPanelModel.useOpsPanelContainer(...args)
  if (props.loadingSettings) return <PageSkeleton variant="form" />
  return <OpsPanelOpsPanelUi {...props} parts={OpsPanelParts} />
}
export const OpsPanelParts = { OpsPanel: OpsPanelContainer }
export default OpsPanelContainer
