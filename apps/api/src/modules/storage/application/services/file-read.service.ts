import { BadGatewayException, Inject, Injectable, NotFoundException } from '@nestjs/common'

import { OBJECT_STORAGE } from '@/shared-kernel/application/ports/object-storage.port'
import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import {
  isDocumentKey,
  isServableKey,
  urlOfKey,
} from '@/modules/storage/domain/policies/file-key.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  ObjectStoragePort,
  StoredObject,
} from '@/shared-kernel/application/ports/object-storage.port'
import type { UserDocumentRepositoryPort } from '@/modules/storage/application/ports/user-document.repository.port'

export interface ReadableFile extends StoredObject {
  isPrivate: boolean
}

@Injectable()
export class FileReadService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(USER_DOCUMENT_REPOSITORY) private readonly documents: UserDocumentRepositoryPort,
  ) {}

  async read(key: string, userId: string | undefined): Promise<ReadableFile> {
    if (!isServableKey(key)) this.notFound()
    const isPrivate = isDocumentKey(key)
    // Missing file and someone else's file answer the same, so existence does not leak
    if (isPrivate && (!userId || !(await this.documents.ownsUrl(userId, urlOfKey(key))))) {
      this.notFound()
    }

    let stored: StoredObject | null
    try {
      stored = await this.storage.get(key)
    } catch {
      throw new BadGatewayException({
        code: ErrorCode.STORAGE_UNAVAILABLE,
        message: 'Kho tệp đang lỗi, thử lại sau.',
      })
    }
    if (!stored) this.notFound()
    return { ...stored, isPrivate }
  }

  private notFound(): never {
    throw new NotFoundException({ code: ErrorCode.FILE_NOT_FOUND, message: 'Không tìm thấy tệp' })
  }
}
