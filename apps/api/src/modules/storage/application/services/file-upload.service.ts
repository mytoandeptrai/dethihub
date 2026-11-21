import { createHash, createHmac } from 'node:crypto'

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fileTypeFromBuffer } from 'file-type'

import { OBJECT_STORAGE } from '@/modules/object-storage/application/ports/object-storage.port'
import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import { USER_IMAGE_REPOSITORY } from '@/modules/storage/application/ports/user-image.repository.port'
import { FileKind } from '@/modules/storage/domain/enums/file-kind.enum'
import {
  ALLOWED_TYPES,
  buildKey,
  maxBytesOf,
  urlOfKey,
} from '@/modules/storage/domain/policies/file-key.policy'
import {
  checkDocumentQuota,
  checkImageQuota,
} from '@/modules/storage/domain/policies/storage-quota.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { Env } from '@/app/config/env.schema'
import type { ObjectStoragePort } from '@/modules/object-storage/application/ports/object-storage.port'
import type {
  UserDocumentRecord,
  UserDocumentRepositoryPort,
} from '@/modules/storage/application/ports/user-document.repository.port'
import type { UserImageRepositoryPort } from '@/modules/storage/application/ports/user-image.repository.port'

interface DetectedFile {
  mime: string
  ext: string
}

export interface DocumentMeta {
  name?: string
  subject?: string
}

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(USER_DOCUMENT_REPOSITORY) private readonly documents: UserDocumentRepositoryPort,
    @Inject(USER_IMAGE_REPOSITORY) private readonly images: UserImageRepositoryPort,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async uploadImage(ownerId: string, buffer: Buffer): Promise<{ url: string }> {
    const file = await this.detect(buffer, FileKind.IMAGE)
    const key = buildKey(
      FileKind.IMAGE,
      createHash('sha256').update(buffer).digest('hex'),
      file.ext,
    )

    const reserved = await this.images.reserve(ownerId, key, buffer.length, checkImageQuota)
    if ('violation' in reserved) this.quotaExceeded(reserved.violation)

    try {
      await this.storage.put(key, buffer, file.mime)
    } catch {
      if (reserved.created) await this.images.release(ownerId, key)
      this.storageUnavailable()
    }
    return { url: urlOfKey(key) }
  }

  async uploadDocument(
    ownerId: string,
    buffer: Buffer,
    meta: DocumentMeta,
  ): Promise<UserDocumentRecord> {
    const file = await this.detect(buffer, FileKind.DOCUMENT)
    // Keyed hash: owner ids are public, so a plain hash would let anyone compute another user's key
    const secret =
      this.config.get('DOC_KEY_SECRET', { infer: true }) ??
      this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true })
    const hash = createHmac('sha256', `doc-key:${secret}`)
      .update(`${ownerId}\n`)
      .update(buffer)
      .digest('hex')
    const key = buildKey(FileKind.DOCUMENT, hash, file.ext)

    const reserved = await this.documents.reserve(
      ownerId,
      {
        name: meta.name?.trim().slice(0, 200) || `tai-lieu.${file.ext}`,
        mime: file.mime,
        size: buffer.length,
        url: urlOfKey(key),
        subject: meta.subject ? meta.subject.slice(0, 60) : null,
      },
      checkDocumentQuota,
    )
    if ('violation' in reserved) this.quotaExceeded(reserved.violation)

    try {
      await this.storage.put(key, buffer, file.mime)
    } catch {
      await this.documents.delete(ownerId, reserved.document.id)
      this.storageUnavailable()
    }
    return reserved.document
  }

  private async detect(buffer: Buffer, kind: FileKind): Promise<DetectedFile> {
    const limit = maxBytesOf(kind)
    if (buffer.length === 0 || buffer.length > limit) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Tệp rỗng hoặc quá lớn (tối đa ${limit / 1024 / 1024} MB)`,
      })
    }
    // Content decides the type: the declared mime is client-controlled
    const detected = await fileTypeFromBuffer(buffer)
    const allowed =
      detected && Object.hasOwn(ALLOWED_TYPES, detected.mime) ? ALLOWED_TYPES[detected.mime] : null
    if (!detected || !allowed || allowed.kind !== kind) {
      throw new BadRequestException({
        code: ErrorCode.FILE_TYPE_UNSUPPORTED,
        message:
          kind === FileKind.IMAGE
            ? 'Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF'
            : 'Chỉ nhận tệp PDF hoặc DOCX',
      })
    }
    return { mime: detected.mime, ext: allowed.ext }
  }

  private quotaExceeded(message: string): never {
    throw new PayloadTooLargeException({ code: ErrorCode.STORAGE_QUOTA_EXCEEDED, message })
  }

  private storageUnavailable(): never {
    throw new BadGatewayException({
      code: ErrorCode.STORAGE_UNAVAILABLE,
      message: 'Kho tệp đang lỗi, thử lại sau.',
    })
  }
}
