'use client'
import { FeaturesPanelUi } from '@/modules/admin-pages/components/features-panel-ui'
import { useFeaturesPanelContainer } from '@/modules/admin-pages/hooks/use-features-panel-container'

export function FeaturesPanelContainer({ me }: { me: { role: string } }) {
  return <FeaturesPanelUi {...useFeaturesPanelContainer(me)} />
}
