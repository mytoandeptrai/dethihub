'use client'
import PricingUi from '@/modules/public-pages/components/pricing-ui'
import { usePricingContainer } from '@/modules/public-pages/hooks/use-pricing-container'
export default function PricingContainer() {
  const state = usePricingContainer()
  return <PricingUi {...state} />
}
