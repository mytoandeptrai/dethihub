'use client'
import { PageSkeleton } from '@/components/page-skeleton'
import { OverviewPanelOverviewPanelUi } from '@/modules/admin-pages/components/overview-panel-ui'
import { OverviewPanelModel } from '@/modules/admin-pages/hooks'
export function OverviewPanelContainer(
  ...args: Parameters<typeof OverviewPanelModel.useOverviewPanelContainer>
) {
  const props = OverviewPanelModel.useOverviewPanelContainer(...args)
  if (props.loading) return <PageSkeleton variant="dashboard" />
  return <OverviewPanelOverviewPanelUi {...props} parts={OverviewPanelParts} />
}
export const OverviewPanelParts = { OverviewPanel: OverviewPanelContainer }
export default OverviewPanelContainer
