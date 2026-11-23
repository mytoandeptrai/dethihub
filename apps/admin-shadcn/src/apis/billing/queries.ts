import { queryOptions } from '@tanstack/react-query'

import { billingKeys } from './keys'
import * as requests from './requests'
import type * as Types from './types'

export const billingGetPricingQuery = (options: Types.BillingGetPricingInput) =>
  queryOptions({ queryKey: [...billingKeys.all, 'billingGetPricing', options.params], queryFn: () => requests.billingGetPricing(options) })

export const billingGetOrderQuery = (options: Types.BillingGetOrderInput) =>
  queryOptions({ queryKey: [...billingKeys.all, 'billingGetOrder', options.params], queryFn: () => requests.billingGetOrder(options) })

export const billingFirstBonusQuery = (options: Types.BillingFirstBonusInput) =>
  queryOptions({ queryKey: [...billingKeys.all, 'billingFirstBonus', options.params], queryFn: () => requests.billingFirstBonus(options) })
