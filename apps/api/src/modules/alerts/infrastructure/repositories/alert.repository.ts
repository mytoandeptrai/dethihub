import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { AlertRepositoryPort } from '@/modules/alerts/application/ports/alert.repository.port'
import type { AlertMetrics } from '@/modules/alerts/domain/policies/alert-rules.policy'

interface MetricsRow {
  signups_1h: number
  ai_total_15m: number
  ai_err_15m: number
  ai_total_10m: number
  ai_ok_10m: number
  ai_cost_today: number
  maintenance_since: Date | null
}

@Injectable()
export class AlertRepositoryImpl implements AlertRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // auth.users only exists on Supabase; the day boundary follows Asia/Ho_Chi_Minh
  async readMetrics(): Promise<AlertMetrics> {
    const [row] = await this.prisma.$queryRaw<MetricsRow[]>`
      SELECT
        (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '1 hour')::int AS signups_1h,
        (SELECT count(*) FROM ai_calls WHERE created_at > now() - interval '15 minutes')::int AS ai_total_15m,
        (SELECT count(*) FROM ai_calls WHERE created_at > now() - interval '15 minutes' AND NOT ok)::int AS ai_err_15m,
        (SELECT count(*) FROM ai_calls WHERE created_at > now() - interval '10 minutes')::int AS ai_total_10m,
        (SELECT count(*) FROM ai_calls WHERE created_at > now() - interval '10 minutes' AND ok)::int AS ai_ok_10m,
        (SELECT coalesce(sum(cost), 0) FROM ai_calls
          WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
        )::float8 AS ai_cost_today,
        (SELECT CASE WHEN coalesce((value ->> 'on')::boolean, false) THEN updated_at END
          FROM app_settings WHERE key = 'maintenance') AS maintenance_since`
    if (!row) throw new Error('alert metrics returned no row')
    return {
      signups1h: row.signups_1h,
      aiTotal15m: row.ai_total_15m,
      aiErrors15m: row.ai_err_15m,
      aiTotal10m: row.ai_total_10m,
      aiOk10m: row.ai_ok_10m,
      aiCostToday: row.ai_cost_today,
      maintenanceSince: row.maintenance_since,
    }
  }

  async lastSent(): Promise<Map<string, Date>> {
    const rows = await this.prisma.alertState.findMany()
    return new Map(rows.map((row) => [row.kind, row.lastSentAt]))
  }

  async markSent(kind: string, at: Date): Promise<void> {
    await this.prisma.alertState.upsert({
      where: { kind },
      create: { kind, lastSentAt: at },
      update: { lastSentAt: at },
    })
  }
}
