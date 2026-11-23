'use client'
import { HeroSectionUi } from './hero-section-ui'
import {
  FaqSectionUi,
  FinalCtaSectionUi,
  PricingSectionUi,
  SamplesSectionUi,
} from './more-sections-ui'
import { AudienceSectionUi, FeaturesSectionUi, WorkflowSectionUi } from './teaching-sections-ui'

import type { useHomeContainer } from '@/modules/public-pages/hooks'
export function HomeUi(props: ReturnType<typeof useHomeContainer>) {
  return (
    <div className="hub-home">
      <HeroSectionUi />
      <FeaturesSectionUi />
      <WorkflowSectionUi />
      <AudienceSectionUi />
      <SamplesSectionUi />
      <PricingSectionUi packs={props.packs} pricingError={props.pricingError} />
      <FaqSectionUi />
      <FinalCtaSectionUi />
    </div>
  )
}
export default HomeUi
