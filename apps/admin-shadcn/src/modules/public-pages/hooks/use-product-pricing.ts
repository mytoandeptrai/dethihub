'use client'

import { applyPricing } from '@engine-pricing'
import { useQuery } from '@tanstack/react-query'

import { billingGetPricingQuery } from '@/apis/billing/queries'
import { billingGetPricing } from '@/apis/billing/requests'

import type { components } from '@workspace/api-types'

export function useProductPricing(initialPricing?: components['schemas']['PricingResponseDto']) {
  return useQuery({
    ...billingGetPricingQuery({}),
    staleTime: 60_000,
    initialData: initialPricing
      ? () => {
          applyPricing(initialPricing)
          return initialPricing
        }
      : undefined,
    refetchOnMount: 'always',
    queryFn: async () => {
      const config = await billingGetPricing({})
      applyPricing(config)
      return config
    },
  })
}
