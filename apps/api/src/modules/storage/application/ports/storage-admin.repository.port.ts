export const STORAGE_ADMIN_REPOSITORY = Symbol('STORAGE_ADMIN_REPOSITORY')

export interface StorageOverride {
  maxBytes: number
  note: string | null
}

export interface AdminDocumentRow {
  id: string
  ownerId: string
  name: string
  mime: string
  size: number
  url: string
  subject: string | null
  createdAt: Date
}

export interface TopStorageUser {
  ownerId: string
  totalSize: number
  docCount: number
}

export interface StorageAdminRepositoryPort {
  findOverride(userId: string): Promise<StorageOverride | null>
  upsertOverride(userId: string, maxBytes: number, note: string | null): Promise<void>
  deleteOverride(userId: string): Promise<void>
  listDocuments(
    q: string,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminDocumentRow[]; total: number }>
  /** The users with the most document bytes, one grouped query */
  topUsers(limit: number): Promise<TopStorageUser[]>
  findDocument(id: string): Promise<AdminDocumentRow | null>
  delete(id: string): Promise<void>
  /** Another row of any owner pointing at the same stored file */
  hasOtherWithUrl(url: string, exceptId: string): Promise<boolean>
}
