'use client'
import { PageSkeleton } from '@/components/page-skeleton'
import { StatsPanelStatsPanelUi } from '@/modules/admin-pages/components/stats-panel-ui'
import { StatsPanelModel } from '@/modules/admin-pages/hooks'
export function StatsPanelContainer(
  ...args: Parameters<typeof StatsPanelModel.useStatsPanelContainer>
) {
  const props = StatsPanelModel.useStatsPanelContainer(...args)
  if (props.initialLoading) return <PageSkeleton variant="dashboard" />
  return <StatsPanelStatsPanelUi {...props} parts={StatsPanelParts} />
}
export const StatsPanelParts = { StatsPanel: StatsPanelContainer }
export default StatsPanelContainer
