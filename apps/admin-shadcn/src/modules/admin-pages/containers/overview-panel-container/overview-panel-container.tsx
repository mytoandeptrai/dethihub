'use client'
import { OverviewPanelOverviewPanelUi } from '@/modules/admin-pages/components/overview-panel-ui'
import { OverviewPanelModel } from '@/modules/admin-pages/hooks'
export function OverviewPanelContainer(
  ...args: Parameters<typeof OverviewPanelModel.useOverviewPanelContainer>
) {
  const props = OverviewPanelModel.useOverviewPanelContainer(...args)
  return <OverviewPanelOverviewPanelUi {...props} parts={OverviewPanelParts} />
}
export const OverviewPanelParts = { OverviewPanel: OverviewPanelContainer }
export default OverviewPanelContainer
