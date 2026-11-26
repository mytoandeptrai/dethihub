'use client'
import { GlobalDialogUi } from '@/modules/shell/components/global-ui'
import { useGlobalDialogContainer } from '@/modules/shell/hooks/use-global-container'
export default function GlobalDialogContainer() {
  const state = useGlobalDialogContainer()
  return <GlobalDialogUi {...state} />
}
