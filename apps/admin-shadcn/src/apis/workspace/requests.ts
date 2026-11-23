import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export async function removeWorkspaceItems(kind: Types.WorkspaceItemRemoveInput['params']['path']['kind'], ids: string[], signal?: AbortSignal) {
  for (let offset = 0; offset < ids.length; offset += 200) {
    await workspaceItemRemove({ params: { path: { kind }, query: { ids: ids.slice(offset, offset + 200) } }, querySerializer: { array: { style: 'form', explode: false } }, signal })
  }
}

export async function workspaceItemList(options: Types.WorkspaceItemListInput) {
  const { data } = await apiClient.GET('/api/workspace/items', { ...options, cache: 'no-store' })
  return data!
}

export async function workspaceItemSave(options: Types.WorkspaceItemSaveInput) {
  const { data } = await apiClient.PUT('/api/workspace/items/{kind}/{id}', options)
  return data!
}

export async function workspaceItemRemove(options: Types.WorkspaceItemRemoveInput) {
  const { data } = await apiClient.DELETE('/api/workspace/items/{kind}', options)
  return data!
}
