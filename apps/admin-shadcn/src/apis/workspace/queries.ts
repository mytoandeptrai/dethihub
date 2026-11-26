import { queryOptions } from '@tanstack/react-query'

import { workspaceKeys } from './keys'
import * as requests from './requests'

import type * as Types from './types'

export const workspaceItemListQuery = (options: Types.WorkspaceItemListInput) =>
  queryOptions({
    queryKey: [...workspaceKeys.all, 'workspaceItemList', options.params],
    queryFn: () => requests.workspaceItemList(options),
  })
