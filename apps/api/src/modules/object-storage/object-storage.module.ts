import { S3Client } from '@aws-sdk/client-s3'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { OBJECT_STORAGE } from '@/modules/object-storage/application/ports/object-storage.port'
import { R2ObjectStorage } from '@/modules/object-storage/infrastructure/adapters/r2-object-storage.adapter'

import type { Env } from '@/app/config/env.schema'

@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const accountId = config.get('R2_ACCOUNT_ID', { infer: true })
        const accessKeyId = config.get('R2_ACCESS_KEY_ID', { infer: true })
        const secretAccessKey = config.get('R2_SECRET_ACCESS_KEY', { infer: true })
        const bucket = config.get('R2_BUCKET', { infer: true })
        if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
          throw new Error(
            'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are required',
          )
        }
        const client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId, secretAccessKey },
        })
        return new R2ObjectStorage(client, bucket)
      },
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class ObjectStorageModule {}
