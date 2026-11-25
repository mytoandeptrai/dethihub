import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type BillingGetPricingInput = FetchOptions<paths['/api/billing/pricing']['get']>
export type BillingCreateOrderInput = FetchOptions<paths['/api/billing/orders']['post']>
export type BillingGetOrderInput = FetchOptions<paths['/api/billing/orders/{orderCode}']['get']>
export type BillingCancelOrderInput = FetchOptions<
  paths['/api/billing/orders/{orderCode}/cancel']['post']
>
export type BillingFirstBonusInput = FetchOptions<paths['/api/billing/first-bonus']['get']>
