import { Inject, Injectable, PayloadTooLargeException } from '@nestjs/common'

import { WORKSPACE_ITEM_REPOSITORY } from '@/modules/workspace/application/ports/workspace-item.repository.port'
import { checkItemQuota } from '@/modules/workspace/domain/policies/item-quota.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  StoredItem,
  WorkspaceItemRepositoryPort,
} from '@/modules/workspace/application/ports/workspace-item.repository.port'
import type { ItemKind } from '@/modules/workspace/domain/enums/item-kind.enum'

@Injectable()
export class WorkspaceItemService {
  constructor(
    @Inject(WORKSPACE_ITEM_REPOSITORY) private readonly items: WorkspaceItemRepositoryPort,
  ) {}

  list(ownerId: string, kind: ItemKind): Promise<StoredItem[]> {
    return this.items.list(ownerId, kind)
  }

  async save(
    ownerId: string,
    kind: ItemKind,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.items.saveWithinQuota(ownerId, kind, id, data, checkItemQuota)
    if ('violation' in result) {
      throw new PayloadTooLargeException({
        code: ErrorCode.STORAGE_QUOTA_EXCEEDED,
        message: result.violation,
      })
    }
  }

  remove(ownerId: string, kind: ItemKind, ids: string[]): Promise<void> {
    return this.items.deleteMany(ownerId, kind, ids)
  }
}
