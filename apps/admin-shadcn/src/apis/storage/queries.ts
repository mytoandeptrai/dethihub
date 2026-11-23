import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from './keys'
import * as requests from './requests'
import type * as Types from './types'

export const storageListDocumentsQuery = (options: Types.StorageListDocumentsInput) =>
  queryOptions({ queryKey: [...storageKeys.all, 'storageListDocuments', options.params], queryFn: () => requests.storageListDocuments(options) })

export const storageUsageQuery = (options: Types.StorageUsageInput) =>
  queryOptions({ queryKey: [...storageKeys.all, 'storageUsage', options.params], queryFn: () => requests.storageUsage(options) })
