import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'

import { STORAGE_ADMIN_REPOSITORY } from '@/modules/storage/application/ports/storage-admin.repository.port'
import { USER_DOCUMENT_REPOSITORY } from '@/modules/storage/application/ports/user-document.repository.port'
import { documentKeyFromUrl } from '@/modules/storage/domain/policies/file-key.policy'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { OBJECT_STORAGE } from '@/shared-kernel/application/ports/object-storage.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  AdminDocumentRow,
  StorageAdminRepositoryPort,
  StorageOverride,
} from '@/modules/storage/application/ports/storage-admin.repository.port'
import type { UserDocumentRepositoryPort } from '@/modules/storage/application/ports/user-document.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { ObjectStoragePort } from '@/shared-kernel/application/ports/object-storage.port'
import type { UserProfileLookupPort } from '@/shared-kernel/application/ports/user-profile-lookup.port'

const MIB = 1024 * 1024
const DEFAULT_BYTES = 10 * MIB
const TOP_USERS = 20

export interface UserStorageView {
  override: StorageOverride | null
  defaultBytes: number
  used: number
}

export interface DocumentWithOwner {
  document: AdminDocumentRow
  ownerEmail: string | null
}

export interface TopUserView {
  ownerId: string
  email: string
  name: string
  totalSize: number
  docCount: number
}

@Injectable()
export class StorageAdminService {
  constructor(
    @Inject(STORAGE_ADMIN_REPOSITORY) private readonly repository: StorageAdminRepositoryPort,
    @Inject(USER_DOCUMENT_REPOSITORY) private readonly documents: UserDocumentRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    @Inject(USER_PROFILE_LOOKUP) private readonly users: UserProfileLookupPort,
  ) {}

  async getUser(userId: string): Promise<UserStorageView> {
    const [override, usage] = await Promise.all([
      this.repository.findOverride(userId),
      this.documents.usage(userId),
    ])
    return { override, defaultBytes: DEFAULT_BYTES, used: usage.used }
  }

  async setUser(adminId: string, userId: string, maxBytes: number | null, note: string) {
    if (maxBytes === null) {
      await this.repository.deleteOverride(userId)
      await this.audit.record(adminId, 'storage.clear', userId)
      return
    }
    if (!(maxBytes >= MIB && maxBytes <= 1024 * MIB)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Dung lượng phải từ 1 MB đến 1024 MB.',
      })
    }
    await this.repository.upsertOverride(userId, maxBytes, note || null)
    await this.audit.record(adminId, 'storage.set', userId, { maxBytes, note })
  }

  async listDocuments(
    q: string,
    page: number,
    perPage: number,
  ): Promise<{ items: DocumentWithOwner[]; topUsers: TopUserView[]; total: number }> {
    const [{ rows, total }, top] = await Promise.all([
      this.repository.listDocuments(q, page, perPage),
      this.repository.topUsers(TOP_USERS).catch(() => []),
    ])
    const contacts = await this.users
      .getContacts([...rows.map((row) => row.ownerId), ...top.map((user) => user.ownerId)])
      .catch(() => new Map())
    return {
      total,
      items: rows.map((document) => ({
        document,
        ownerEmail: contacts.get(document.ownerId)?.email ?? null,
      })),
      topUsers: top.map((user) => ({
        ownerId: user.ownerId,
        email: contacts.get(user.ownerId)?.email ?? user.ownerId.slice(0, 8),
        name: contacts.get(user.ownerId)?.name ?? '',
        totalSize: user.totalSize,
        docCount: user.docCount,
      })),
    }
  }

  /** Row first, then the stored file, and only when no other row still points at it */
  async deleteDocument(adminId: string, id: string): Promise<{ fileRemoved: boolean }> {
    const document = await this.repository.findDocument(id)
    if (!document) {
      throw new NotFoundException({
        code: ErrorCode.DOCUMENT_NOT_FOUND,
        message: 'Không tìm thấy tài liệu.',
      })
    }
    await this.repository.delete(id)

    const key = documentKeyFromUrl(document.url)
    let fileRemoved = false
    if (key && !(await this.repository.hasOtherWithUrl(document.url, id))) {
      fileRemoved = await this.storage.delete(key).then(
        () => true,
        () => false,
      )
    }
    await this.audit.record(adminId, 'content.docs.delete', id, {
      name: document.name,
      ownerId: document.ownerId,
      size: document.size,
      fileRemoved,
    })
    return { fileRemoved }
  }
}
