'use client'
import { FeedbackUi } from '@/modules/shell/components'
import { useFeedbackContainer } from '@/modules/shell/hooks'

import type { FeedbackProps } from '@/modules/shell/hooks'
export default function FeedbackContainer(props: FeedbackProps) {
  const state = useFeedbackContainer(props)
  return <FeedbackUi {...state} />
}
