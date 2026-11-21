import type { ItemKind } from '@/modules/workspace/domain/enums/item-kind.enum'
import type { ItemQuotaSnapshot } from '@/modules/workspace/domain/policies/item-quota.policy'

export const WORKSPACE_ITEM_REPOSITORY = Symbol('WORKSPACE_ITEM_REPOSITORY')

export interface StoredItem {
  id: string
  data: Record<string, unknown>
}

export type SaveItemResult = { saved: true } | { violation: string }

export interface WorkspaceItemRepositoryPort {
  list(ownerId: string, kind: ItemKind): Promise<StoredItem[]>
  /**
   * Measures, asks `check` and writes under one per-owner lock, so two writes of the same
   * owner (here or in the document store) cannot both pass on a stale total.
   */
  saveWithinQuota(
    ownerId: string,
    kind: ItemKind,
    id: string,
    data: Record<string, unknown>,
    check: (snapshot: ItemQuotaSnapshot) => string | null,
  ): Promise<SaveItemResult>
  deleteMany(ownerId: string, kind: ItemKind, ids: string[]): Promise<void>
}
