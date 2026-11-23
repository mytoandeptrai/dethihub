'use client'

import { applyPricing } from '@engine-pricing'
import { useQuery } from '@tanstack/react-query'

import { billingGetPricingQuery } from '@/apis/billing/queries'
import { billingGetPricing } from '@/apis/billing/requests'

export function useProductPricing() {
  return useQuery({
    ...billingGetPricingQuery({}),
    staleTime: 60_000,
    queryFn: async () => {
      const config = await billingGetPricing({})
      applyPricing(config)
      return config
    },
  })
}
