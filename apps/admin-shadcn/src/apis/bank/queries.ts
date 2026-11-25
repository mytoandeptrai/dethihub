import { queryOptions } from '@tanstack/react-query'

import { bankKeys } from './keys'
import * as requests from './requests'

import type * as Types from './types'

export const bankOverridesQuery = (options: Types.BankOverridesInput) =>
  queryOptions({
    queryKey: [...bankKeys.all, 'bankOverrides', options.params],
    queryFn: () => requests.bankOverrides(options),
  })
