import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type WorkspaceItemListInput = FetchOptions<paths['/api/workspace/items']['get']>
export type WorkspaceItemSaveInput = FetchOptions<paths['/api/workspace/items/{kind}/{id}']['put']>
export type WorkspaceItemRemoveInput = FetchOptions<paths['/api/workspace/items/{kind}']['delete']>
