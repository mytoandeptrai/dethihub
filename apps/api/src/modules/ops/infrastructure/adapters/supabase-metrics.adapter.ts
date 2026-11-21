import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { Env } from '@/app/config/env.schema'
import type {
  DbMetricsSnapshot,
  DbMetricsSourcePort,
} from '@/modules/ops/application/ports/db-metrics.port'

const TIMEOUT_MS = 10_000

@Injectable()
export class SupabaseMetricsAdapter implements DbMetricsSourcePort {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async fetch(): Promise<DbMetricsSnapshot> {
    const base = this.config.get('SUPABASE_URL', { infer: true }).replace(/\/+$/, '')
    const key = this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true })
    const auth = `Basic ${Buffer.from(`service_role:${key}`).toString('base64')}`
    const response = await fetch(`${base}/customer/v1/privileged/metrics`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Supabase metrics trả ${response.status}`)
    return {
      raw: await response.text(),
      region: this.config.get('SUPABASE_REGION', { infer: true }),
      compute: this.config.get('SUPABASE_COMPUTE', { infer: true }),
    }
  }
}
