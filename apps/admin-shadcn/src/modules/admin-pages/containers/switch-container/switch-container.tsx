'use client'
import { SwitchSwitchUi } from '@/modules/admin-pages/components/switch-ui'
import { SwitchModel } from '@/modules/admin-pages/hooks'
export function SwitchContainer(...args: Parameters<typeof SwitchModel.useSwitchContainer>) {
  const props = SwitchModel.useSwitchContainer(...args)
  return <SwitchSwitchUi {...props} parts={SwitchParts} />
}
export const SwitchParts = { Switch: SwitchContainer }
export default SwitchContainer
