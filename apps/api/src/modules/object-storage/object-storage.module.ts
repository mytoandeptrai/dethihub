import { S3Client } from '@aws-sdk/client-s3'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'

import { R2ObjectStorageAdapter } from '@/modules/object-storage/infrastructure/adapters/r2-object-storage.adapter'
import { SupabaseObjectStorageAdapter } from '@/modules/object-storage/infrastructure/adapters/supabase-object-storage.adapter'
import { OBJECT_STORAGE } from '@/shared-kernel/application/ports/object-storage.port'

import type { Env } from '@/app/config/env.schema'

@Global() // @global-approved: storage, media and ops consume the shared object storage port
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        if (config.get('STORAGE_DRIVER', { infer: true }) === 'supabase') {
          const client = createClient(
            config.get('SUPABASE_URL', { infer: true }),
            config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }),
            { auth: { persistSession: false, autoRefreshToken: false } },
          )
          return new SupabaseObjectStorageAdapter(
            client,
            config.get('SUPABASE_STORAGE_BUCKET', { infer: true }),
          )
        }
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
        return new R2ObjectStorageAdapter(client, bucket)
      },
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class ObjectStorageModule {}
