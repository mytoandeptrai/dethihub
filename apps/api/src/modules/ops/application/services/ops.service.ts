import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { OBJECT_STORAGE } from '@/modules/object-storage/application/ports/object-storage.port'
import { DB_METRICS_SOURCE } from '@/modules/ops/application/ports/db-metrics.port'
import { OPS_QUERY_REPOSITORY } from '@/modules/ops/application/ports/ops-query.repository.port'
import { computeDbMetrics, parsePrometheus } from '@/modules/ops/domain/policies/prometheus.policy'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { Env } from '@/app/config/env.schema'
import type { ObjectStoragePort } from '@/modules/object-storage/application/ports/object-storage.port'
import type { DbMetricsSourcePort } from '@/modules/ops/application/ports/db-metrics.port'
import type {
  OpsQueryRepositoryPort,
  StatsOverview,
} from '@/modules/ops/application/ports/ops-query.repository.port'
import type { DbMetrics } from '@/modules/ops/domain/policies/prometheus.policy'
import type { UserProfileLookupPort } from '@/shared-kernel/application/ports/user-profile-lookup.port'

const ONLINE_LIMIT = 20
const PING_TIMEOUT_MS = 10_000

export type HealthTarget = 'supabase' | 'r2'

export interface PingResult {
  ok: boolean
  ms: number
  error?: string
}

export interface OnlineUser {
  userId: string
  email: string
  name: string
  avatar: string
  lastSeen: Date
}

const mask = (key: string) => (key ? `••••${key.slice(-4)}` : '')

@Injectable()
export class OpsService {
  constructor(
    @Inject(OPS_QUERY_REPOSITORY) private readonly queries: OpsQueryRepositoryPort,
    @Inject(DB_METRICS_SOURCE) private readonly metrics: DbMetricsSourcePort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(USER_PROFILE_LOOKUP) private readonly profiles: UserProfileLookupPort,
    private readonly config: ConfigService<Env, true>,
  ) {}

  overview(days: number): Promise<StatsOverview> {
    return this.queries.overview(days)
  }

  async online(): Promise<{ total: number; users: OnlineUser[] }> {
    const { total, rows } = await this.queries.online(ONLINE_LIMIT)
    const contacts = await this.profiles
      .getContacts(rows.map((row) => row.userId))
      .catch(() => new Map())
    const users = rows.map((row) => {
      const contact = contacts.get(row.userId)
      const email = contact?.email ?? ''
      return {
        userId: row.userId,
        email,
        name: contact?.name || email.split('@')[0] || '',
        avatar: contact?.avatar ?? '',
        lastSeen: row.lastSeen,
      }
    })
    return { total, users }
  }

  async health(target: string | undefined): Promise<{
    checkedAt: string
    supabase?: PingResult
    r2?: PingResult
  }> {
    if (target && target !== 'supabase' && target !== 'r2') {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Dịch vụ cần kiểm tra không hợp lệ.',
      })
    }
    const checkedAt = new Date().toISOString()
    const [supabase, r2] = await Promise.all([
      !target || target === 'supabase' ? this.#timed(() => this.queries.pingDatabase()) : undefined,
      !target || target === 'r2' ? this.#timed(() => this.#pingStorage()) : undefined,
    ])
    return { checkedAt, ...(supabase && { supabase }), ...(r2 && { r2 }) }
  }

  targets(): Record<HealthTarget, { endpoint: string; keyMask: string }> {
    return {
      supabase: {
        endpoint: this.config.get('SUPABASE_URL', { infer: true }),
        keyMask: mask(this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true })),
      },
      r2: {
        endpoint:
          this.config.get('STORAGE_DRIVER', { infer: true }) === 'r2'
            ? `https://${this.config.get('R2_ACCOUNT_ID', { infer: true }) ?? ''}.r2.cloudflarestorage.com`
            : this.config.get('SUPABASE_URL', { infer: true }),
        keyMask: mask(this.config.get('R2_ACCESS_KEY_ID', { infer: true }) ?? ''),
      },
    }
  }

  async dbMetrics(): Promise<
    { name: string; region: string; compute: string; checkedAt: string } & DbMetrics
  > {
    try {
      const { raw, region, compute } = await this.metrics.fetch()
      return {
        name: 'Primary Database',
        region,
        compute,
        checkedAt: new Date().toISOString(),
        ...computeDbMetrics(parsePrometheus(raw)),
      }
    } catch (error) {
      throw new BadGatewayException({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async #pingStorage(): Promise<void> {
    if (!(await this.storage.ping())) throw new Error('Kho tệp không phản hồi.')
  }

  async #timed(probe: () => Promise<void>): Promise<PingResult> {
    const start = Date.now()
    try {
      await Promise.race([
        probe(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Quá thời gian chờ.')), PING_TIMEOUT_MS)
        }),
      ])
      return { ok: true, ms: Date.now() - start }
    } catch (error) {
      return { ok: false, ms: Date.now() - start, error: String(error) }
    }
  }
}
