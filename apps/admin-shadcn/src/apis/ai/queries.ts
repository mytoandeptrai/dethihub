import { queryOptions } from '@tanstack/react-query'

import { aiKeys } from './keys'
import * as requests from './requests'
import type * as Types from './types'

export const aiQuotaQuery = (options: Types.AiQuotaInput) =>
  queryOptions({ queryKey: [...aiKeys.all, 'aiQuota', options.params], queryFn: () => requests.aiQuota(options) })

export const aiCreditEventsQuery = (options: Types.AiCreditEventsInput) =>
  queryOptions({ queryKey: [...aiKeys.all, 'aiCreditEvents', options.params], queryFn: () => requests.aiCreditEvents(options) })
