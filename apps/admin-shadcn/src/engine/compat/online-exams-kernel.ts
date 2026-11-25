'use client'

import dynamic from 'next/dynamic'

export { QuestionBody } from '@/engine/components/lazy-question-body'
export { MathText } from '@/engine/components/lazy-math-text'

export const QuestionImageField = dynamic(
  () =>
    import('@/engine/components/QuestionImageField').then((module) => module.QuestionImageField),
  { ssr: false },
)
export const OnlineAiBox = dynamic(
  () => import('@/engine/components/OnlineAiBox').then((module) => module.OnlineAiBox),
  { ssr: false },
)
