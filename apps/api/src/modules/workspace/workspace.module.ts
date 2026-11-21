import { Module } from '@nestjs/common'

import { WORKSPACE_ITEM_REPOSITORY } from '@/modules/workspace/application/ports/workspace-item.repository.port'
import { WorkspaceItemService } from '@/modules/workspace/application/services/workspace-item.service'
import { WorkspaceItemRepositoryImpl } from '@/modules/workspace/infrastructure/repositories/workspace-item.repository'
import { WorkspaceItemController } from '@/modules/workspace/presentation/controllers/workspace-item.controller'
import { USER_DATA_REPOSITORY } from '@/modules/workspace/application/ports/user-data.repository.port'
import { UserDeletionListener } from '@/modules/workspace/application/listeners/user-deletion.listener'
import { UserDataRepositoryImpl } from '@/modules/workspace/infrastructure/repositories/user-data.repository'

@Module({
  controllers: [WorkspaceItemController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    WorkspaceItemService,
    { provide: WORKSPACE_ITEM_REPOSITORY, useClass: WorkspaceItemRepositoryImpl },
  ],
})
export class WorkspaceModule {}
