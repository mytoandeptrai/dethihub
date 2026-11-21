import { Module } from '@nestjs/common'

import { ObjectStorageModule } from '@/modules/object-storage/object-storage.module'
import { UserDeletionListener } from '@/modules/storage/application/listeners/user-deletion.listener'
import { STORAGE_ADMIN_REPOSITORY } from '@/modules/storage/application/ports/storage-admin.repository.port'
import { USER_DATA_REPOSITORY } from '@/modules/storage/application/ports/user-data.repository.port'
import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import { USER_IMAGE_REPOSITORY } from '@/modules/storage/application/ports/user-image.repository.port'
import { FileReadService } from '@/modules/storage/application/services/file-read.service'
import { FileUploadService } from '@/modules/storage/application/services/file-upload.service'
import { StorageAdminService } from '@/modules/storage/application/services/storage-admin.service'
import { UserDocumentService } from '@/modules/storage/application/services/user-document.service'
import { StorageAdminRepositoryImpl } from '@/modules/storage/infrastructure/repositories/storage-admin.repository'
import { UserDataRepositoryImpl } from '@/modules/storage/infrastructure/repositories/user-data.repository'
import { UserDocumentRepositoryImpl } from '@/modules/storage/infrastructure/repositories/user-document.repository'
import { UserImageRepositoryImpl } from '@/modules/storage/infrastructure/repositories/user-image.repository'
import { FileController } from '@/modules/storage/presentation/controllers/file.controller'
import { StorageAdminController } from '@/modules/storage/presentation/controllers/storage-admin.controller'
import { StorageController } from '@/modules/storage/presentation/controllers/storage.controller'

@Module({
  imports: [ObjectStorageModule],
  controllers: [StorageController, FileController, StorageAdminController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    FileUploadService,
    FileReadService,
    UserDocumentService,
    StorageAdminService,
    { provide: STORAGE_ADMIN_REPOSITORY, useClass: StorageAdminRepositoryImpl },
    { provide: USER_DOCUMENT_REPOSITORY, useClass: UserDocumentRepositoryImpl },
    { provide: USER_IMAGE_REPOSITORY, useClass: UserImageRepositoryImpl },
  ],
})
export class StorageModule {}
