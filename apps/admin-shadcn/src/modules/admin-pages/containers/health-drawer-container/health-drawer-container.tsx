'use client'
import {
  HealthDrawerHealthDrawerUi,
  HealthDrawerProviderFormUi,
} from '@/modules/admin-pages/components/health-drawer-ui'
import { HealthDrawerModel } from '@/modules/admin-pages/hooks'
export function HealthDrawerContainer(
  ...args: Parameters<typeof HealthDrawerModel.useHealthDrawerContainer>
) {
  const props = HealthDrawerModel.useHealthDrawerContainer(...args)
  return <HealthDrawerHealthDrawerUi {...props} parts={HealthDrawerParts} />
}
export function ProviderFormContainer(
  ...args: Parameters<typeof HealthDrawerModel.useProviderFormContainer>
) {
  const props = HealthDrawerModel.useProviderFormContainer(...args)
  return <HealthDrawerProviderFormUi {...props} parts={HealthDrawerParts} />
}
export const HealthDrawerParts = {
  HealthDrawer: HealthDrawerContainer,
  ProviderForm: ProviderFormContainer,
}
export default HealthDrawerContainer
