import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

import type {
  ObjectStoragePort,
  StoredObject,
} from '@/shared-kernel/application/ports/object-storage.port'
import type { S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

const isNotFound = (error: unknown): boolean => {
  const { name, $metadata } = error as { name?: string; $metadata?: { httpStatusCode?: number } }
  return name === 'NoSuchKey' || name === 'NotFound' || $metadata?.httpStatusCode === 404
}

export class R2ObjectStorage implements ObjectStoragePort {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    )
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      if (!result.Body) return null
      return {
        stream: result.Body as Readable,
        contentType: result.ContentType,
        size: result.ContentLength,
      }
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return true
    } catch (error) {
      if (isNotFound(error)) return false
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
      return true
    } catch {
      return false
    }
  }
}
