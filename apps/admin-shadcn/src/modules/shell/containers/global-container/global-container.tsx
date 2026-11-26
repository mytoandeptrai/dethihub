'use client'
import { GlobalUi } from '@/modules/shell/components/global-ui'
import GlobalDialogContainer from '@/modules/shell/containers/global-dialog-container'
import { useGlobalContainer } from '@/modules/shell/hooks/use-global-container'

import type { ReactNode } from 'react'
export default function GlobalContainer({ children }: { children: ReactNode }) {
  const state = useGlobalContainer()
  return (
    <>
      <GlobalUi {...state}>{children}</GlobalUi>
      <GlobalDialogContainer />
    </>
  )
}
