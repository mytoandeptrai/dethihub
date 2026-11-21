export const USER_DOCUMENT_REPOSITORY = Symbol('USER_DOCUMENT_REPOSITORY')

export interface UserDocumentRecord {
  id: string
  name: string
  mime: string
  size: number
  url: string
  subject: string | null
  createdAt: Date
}

export interface NewDocument {
  name: string
  mime: string
  size: number
  url: string
  subject: string | null
}

export type ReserveDocumentResult = { document: UserDocumentRecord } | { violation: string }

export interface KindUsage {
  count: number
  bytes: number
  limit: number | null
}

export interface StorageUsage {
  used: number
  max: number
  kinds: Record<string, KindUsage>
}

export interface UserDocumentRepositoryPort {
  reserve(
    ownerId: string,
    input: NewDocument,
    check: (used: number, max: number, size: number) => string | null,
  ): Promise<ReserveDocumentResult>
  list(ownerId: string): Promise<UserDocumentRecord[]>
  findOwned(ownerId: string, id: string): Promise<UserDocumentRecord | null>
  /** Another row of the same owner pointing at the same stored file */
  hasOtherWithUrl(ownerId: string, url: string, exceptId: string): Promise<boolean>
  ownsUrl(ownerId: string, url: string): Promise<boolean>
  delete(ownerId: string, id: string): Promise<void>
  usage(ownerId: string): Promise<StorageUsage>
}
