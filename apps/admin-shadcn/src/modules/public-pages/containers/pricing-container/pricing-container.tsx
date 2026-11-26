'use client'
import PricingUi from '@/modules/public-pages/components/pricing-ui'
import { usePricingContainer } from '@/modules/public-pages/hooks/use-pricing-container'
export default function PricingContainer({
  initialPricing,
}: {
  initialPricing?: Parameters<typeof usePricingContainer>[0]
} = {}) {
  const state = usePricingContainer(initialPricing)
  return <PricingUi {...state} />
}
