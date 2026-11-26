import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export async function billingGetPricing(options: Types.BillingGetPricingInput) {
  const { data } = await apiClient.GET('/api/billing/pricing', options)
  return data!
}

export async function billingCreateOrder(options: Types.BillingCreateOrderInput) {
  const { data } = await apiClient.POST('/api/billing/orders', options)
  return data!
}

export async function billingGetOrder(options: Types.BillingGetOrderInput) {
  const { data } = await apiClient.GET('/api/billing/orders/{orderCode}', options)
  return data!
}

export async function billingCancelOrder(options: Types.BillingCancelOrderInput) {
  const { data } = await apiClient.POST('/api/billing/orders/{orderCode}/cancel', options)
  return data!
}

export async function billingFirstBonus(options: Types.BillingFirstBonusInput) {
  const { data } = await apiClient.GET('/api/billing/first-bonus', options)
  return data!
}
