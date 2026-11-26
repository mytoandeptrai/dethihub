'use client'

import { DEFAULT_PRICING } from '@engine-pricing'

import { useProductPricing } from './use-product-pricing'

export function useHomeContainer() {
  const pricing = useProductPricing()
  return {
    packs: pricing.isPending ? null : (pricing.data?.packs ?? DEFAULT_PRICING.packs),
    pricingError: pricing.error?.message,
  }
}
