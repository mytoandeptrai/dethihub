'use client'
import { GlobalDialogUi } from '@/modules/shell/components'
import { useGlobalDialogContainer } from '@/modules/shell/hooks'
export default function GlobalDialogContainer() {
  const state = useGlobalDialogContainer()
  return <GlobalDialogUi {...state} />
}
