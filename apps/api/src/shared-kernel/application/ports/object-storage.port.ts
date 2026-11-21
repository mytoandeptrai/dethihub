import type { Readable } from 'node:stream'

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE')

export interface StoredObject {
  stream: Readable
  contentType?: string
  size?: number
}

export interface ObjectStoragePort {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  /** null when the key does not exist */
  get(key: string): Promise<StoredObject | null>
  exists(key: string): Promise<boolean>
  delete(key: string): Promise<void>
  ping(): Promise<boolean>
}
