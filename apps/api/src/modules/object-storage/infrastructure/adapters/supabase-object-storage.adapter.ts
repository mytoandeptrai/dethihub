import { Readable } from 'node:stream'

import type {
  ObjectStoragePort,
  StoredObject,
} from '@/modules/object-storage/application/ports/object-storage.port'
import type { SupabaseClient } from '@supabase/supabase-js'

const isNotFound = (error: { message?: string; statusCode?: string; status?: number }): boolean =>
  error.statusCode === '404' || error.status === 404 || /not.?found/i.test(error.message ?? '')

export class SupabaseObjectStorageAdapter implements ObjectStoragePort {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string,
  ) {}

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, body, { contentType, upsert: true })
    if (error) throw error
  }

  async get(key: string): Promise<StoredObject | null> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key)
    if (error) {
      if (isNotFound(error as { message?: string })) return null
      throw error
    }
    return {
      stream: Readable.fromWeb(data.stream() as Parameters<typeof Readable.fromWeb>[0]),
      contentType: data.type || undefined,
      size: data.size,
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.storage.from(this.bucket).exists(key)
      if (error) throw error
      return data
    } catch (error) {
      if (isNotFound(error as { message?: string })) return false
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key])
    if (error) throw error
  }

  async ping(): Promise<boolean> {
    const { error } = await this.client.storage.getBucket(this.bucket)
    return !error
  }
}
