'use client'
import { AppShellUi } from '@/modules/shell/components'
import FeedbackContainer from '@/modules/shell/containers/feedback-container'
import { useAppShellContainer } from '@/modules/shell/hooks'

import type { ReactNode } from 'react'
export default function AppShellContainer({ children }: { children: ReactNode }) {
  const state = useAppShellContainer()
  return (
    <>
      <AppShellUi {...state}>{children}</AppShellUi>
      <FeedbackContainer open={state.feedbackOpen} onOpenChange={state.onFeedbackChange} />
    </>
  )
}
