'use client'
import { PricingUi } from '@/modules/public-pages/components'
import { usePricingContainer } from '@/modules/public-pages/hooks'
export default function PricingContainer() {
  const state = usePricingContainer()
  return <PricingUi {...state} />
}
