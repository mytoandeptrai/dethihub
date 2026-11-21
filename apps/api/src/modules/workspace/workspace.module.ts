import { Module } from '@nestjs/common'

import { WORKSPACE_ITEM_REPOSITORY } from '@/modules/workspace/application/ports/workspace-item.repository.port'
import { WorkspaceItemService } from '@/modules/workspace/application/services/workspace-item.service'
import { WorkspaceItemRepositoryImpl } from '@/modules/workspace/infrastructure/repositories/workspace-item.repository'
import { WorkspaceItemController } from '@/modules/workspace/presentation/controllers/workspace-item.controller'

@Module({
  controllers: [WorkspaceItemController],
  providers: [
    WorkspaceItemService,
    { provide: WORKSPACE_ITEM_REPOSITORY, useClass: WorkspaceItemRepositoryImpl },
  ],
})
export class WorkspaceModule {}
