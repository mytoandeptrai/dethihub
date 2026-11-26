'use client'
import { GradingStatUi, GradingUi } from '@/modules/workspace/components'
import { GradingModel } from '@/modules/workspace/hooks'

export function GradingContainer(...args: Parameters<typeof GradingModel.useGradingContainer>) {
  const props = GradingModel.useGradingContainer(...args)
  return <GradingUi {...props} parts={GradingParts} />
}

export function StatContainer(...args: Parameters<typeof GradingModel.useStatContainer>) {
  const props = GradingModel.useStatContainer(...args)
  return <GradingStatUi {...props} parts={GradingParts} />
}

export const GradingParts = { Grading: GradingContainer, Stat: StatContainer }
export default GradingContainer
