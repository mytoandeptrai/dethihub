import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  OnlineRow,
  OpsQueryRepositoryPort,
  StatsOverview,
} from '@/modules/ops/application/ports/ops-query.repository.port'

const TZ = 'Asia/Ho_Chi_Minh'

interface DayRow {
  day: string
  new_users: number
  new_docs: number
  new_decks: number
  new_community_exams: number
}

@Injectable()
export class OpsQueryRepositoryImpl implements OpsQueryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days: number): Promise<StatsOverview> {
    const [totals, chart] = await Promise.all([
      this.prisma.$queryRaw<{ total: number; active7: number; active30: number; online: number }[]>`
        SELECT
          (SELECT count(*)::int FROM auth.users) AS total,
          (SELECT count(*)::int FROM presence WHERE last_seen >= now() - interval '2 minutes') AS online,
          count(*) FILTER (WHERE greatest(u.last_sign_in_at, p.last_seen) >= now() - interval '7 days')::int AS active7,
          count(*) FILTER (WHERE greatest(u.last_sign_in_at, p.last_seen) >= now() - interval '30 days')::int AS active30
        FROM auth.users u LEFT JOIN presence p ON p.user_id = u.id`,
      this.prisma.$queryRaw<DayRow[]>`
        WITH range AS (
          SELECT d::date AS day FROM generate_series(
            (now() AT TIME ZONE ${TZ})::date - (${days}::int - 1),
            (now() AT TIME ZONE ${TZ})::date, interval '1 day') AS d
        ),
        start AS (
          SELECT ((now() AT TIME ZONE ${TZ})::date - (${days}::int - 1))::timestamp AT TIME ZONE ${TZ} AS at
        ),
        users AS (
          SELECT (created_at AT TIME ZONE ${TZ})::date AS day, count(*)::int AS n
          FROM auth.users WHERE created_at >= (SELECT at FROM start) GROUP BY 1
        ),
        items AS (
          SELECT (created_at AT TIME ZONE ${TZ})::date AS day,
            count(*) FILTER (WHERE kind = 'doc')::int AS docs,
            count(*) FILTER (WHERE kind = 'deck')::int AS decks
          FROM user_items WHERE created_at IS NOT NULL AND created_at >= (SELECT at FROM start) GROUP BY 1
        ),
        exams AS (
          SELECT (created_at AT TIME ZONE ${TZ})::date AS day, count(*)::int AS n
          FROM community_exams WHERE created_at >= (SELECT at FROM start) GROUP BY 1
        )
        SELECT r.day::text AS day, coalesce(u.n, 0) AS new_users, coalesce(i.docs, 0) AS new_docs,
          coalesce(i.decks, 0) AS new_decks, coalesce(e.n, 0) AS new_community_exams
        FROM range r LEFT JOIN users u USING (day) LEFT JOIN items i USING (day) LEFT JOIN exams e USING (day)
        ORDER BY r.day`,
    ])
    const total = totals[0]
    return {
      totalUsers: total?.total ?? 0,
      active7d: total?.active7 ?? 0,
      active30d: total?.active30 ?? 0,
      onlineCount: total?.online ?? 0,
      chartDays: chart.map((row) => ({
        day: row.day,
        newUsers: row.new_users,
        newDocs: row.new_docs,
        newDecks: row.new_decks,
        newCommunityExams: row.new_community_exams,
      })),
    }
  }

  async online(limit: number): Promise<{ total: number; rows: OnlineRow[] }> {
    const since = new Date(Date.now() - 2 * 60_000)
    const where = { lastSeen: { gte: since } }
    const [rows, total] = await Promise.all([
      this.prisma.presence.findMany({ where, orderBy: { lastSeen: 'desc' }, take: limit }),
      this.prisma.presence.count({ where }),
    ])
    return { total, rows: rows.map((row) => ({ userId: row.userId, lastSeen: row.lastSeen })) }
  }

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
