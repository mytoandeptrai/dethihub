'use client'
import { AuditPanelAuditPanelUi } from '@/modules/admin-pages/components/audit-panel-ui'
import { AuditPanelModel } from '@/modules/admin-pages/hooks'
export function AuditPanelContainer(
  ...args: Parameters<typeof AuditPanelModel.useAuditPanelContainer>
) {
  const props = AuditPanelModel.useAuditPanelContainer(...args)
  return <AuditPanelAuditPanelUi {...props} parts={AuditPanelParts} />
}
export const AuditPanelParts = { AuditPanel: AuditPanelContainer }
export default AuditPanelContainer
