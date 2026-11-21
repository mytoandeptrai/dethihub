import { Module } from '@nestjs/common'

import { ObjectStorageModule } from '@/modules/object-storage/object-storage.module'
import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import { USER_IMAGE_REPOSITORY } from '@/modules/storage/application/ports/user-image.repository.port'
import { FileReadService } from '@/modules/storage/application/services/file-read.service'
import { FileUploadService } from '@/modules/storage/application/services/file-upload.service'
import { UserDocumentService } from '@/modules/storage/application/services/user-document.service'
import { UserDocumentRepositoryImpl } from '@/modules/storage/infrastructure/repositories/user-document.repository'
import { UserImageRepositoryImpl } from '@/modules/storage/infrastructure/repositories/user-image.repository'
import { FileController } from '@/modules/storage/presentation/controllers/file.controller'
import { StorageController } from '@/modules/storage/presentation/controllers/storage.controller'

@Module({
  imports: [ObjectStorageModule],
  controllers: [StorageController, FileController],
  providers: [
    FileUploadService,
    FileReadService,
    UserDocumentService,
    { provide: USER_DOCUMENT_REPOSITORY, useClass: UserDocumentRepositoryImpl },
    { provide: USER_IMAGE_REPOSITORY, useClass: UserImageRepositoryImpl },
  ],
})
export class StorageModule {}
