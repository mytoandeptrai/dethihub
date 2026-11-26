import { BadGatewayException, Inject, Injectable, NotFoundException } from '@nestjs/common'

import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import { documentKeyFromUrl } from '@/modules/storage/domain/policies/file-key.policy'
import { OBJECT_STORAGE } from '@/shared-kernel/application/ports/object-storage.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  StorageUsage,
  UserDocumentRecord,
  UserDocumentRepositoryPort,
} from '@/modules/storage/application/ports/user-document.repository.port'
import type { ObjectStoragePort } from '@/shared-kernel/application/ports/object-storage.port'

@Injectable()
export class UserDocumentService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(USER_DOCUMENT_REPOSITORY) private readonly documents: UserDocumentRepositoryPort,
  ) {}

  list(ownerId: string): Promise<UserDocumentRecord[]> {
    return this.documents.list(ownerId)
  }

  usage(ownerId: string): Promise<StorageUsage> {
    return this.documents.usage(ownerId)
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const document = await this.documents.findOwned(ownerId, id)
    if (!document) {
      throw new NotFoundException({
        code: ErrorCode.DOCUMENT_NOT_FOUND,
        message: 'Không tìm thấy tài liệu.',
      })
    }

    // The stored file is shared by rows with the same url; drop it only with the last row
    const key = documentKeyFromUrl(document.url)
    if (key && !(await this.documents.hasOtherWithUrl(ownerId, document.url, id))) {
      try {
        await this.storage.delete(key)
      } catch {
        throw new BadGatewayException({
          code: ErrorCode.STORAGE_UNAVAILABLE,
          message: 'Không xoá được tệp, thử lại sau.',
        })
      }
    }
    await this.documents.delete(ownerId, id)
  }
}
