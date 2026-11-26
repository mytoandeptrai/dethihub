import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export async function bankOverrides(options: Types.BankOverridesInput) {
  const { data } = await apiClient.GET('/api/bank/overrides', options)
  return data!
}
