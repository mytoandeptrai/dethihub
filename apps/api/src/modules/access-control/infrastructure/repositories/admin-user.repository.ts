import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AdminUserRepositoryPort,
  AuditRow,
  UserActivity,
} from '@/modules/access-control/application/ports/admin-user.repository.port'

const ONLINE_WINDOW = '2 minutes'

interface ActivityRow {
  user_id: string
  docs: number
  decks: number
  tokens: bigint | null
  role: string | null
  strikes: number | null
  locked_until: Date | null
  last_action: string | null
  online: boolean
}

@Injectable()
export class AdminUserRepositoryImpl implements AdminUserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async activityOf(userIds: string[]): Promise<UserActivity[]> {
    if (userIds.length === 0) return []
    const rows = await this.prisma.$queryRaw<ActivityRow[]>`
      SELECT u.id::text AS user_id,
        (SELECT count(*)::int FROM user_items i WHERE i.owner_id = u.id AND i.kind = 'doc') AS docs,
        (SELECT count(*)::int FROM user_items i WHERE i.owner_id = u.id AND i.kind = 'deck') AS decks,
        (SELECT a.tokens FROM ai_usage a
          WHERE a.user_id = u.id AND a.month = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM')) AS tokens,
        (SELECT r.role FROM user_roles r WHERE r.user_id = u.id) AS role,
        f.strikes, f.locked_until, f.last_action,
        COALESCE(p.last_seen >= now() - ${ONLINE_WINDOW}::interval, false) AS online
      FROM unnest(${userIds}::uuid[]) AS u(id)
      LEFT JOIN security_flags f ON f.user_id = u.id
      LEFT JOIN presence p ON p.user_id = u.id`
    return rows.map((row) => ({
      userId: row.user_id,
      docs: row.docs,
      decks: row.decks,
      tokensThisMonth: Number(row.tokens ?? 0),
      role: row.role,
      strikes: row.strikes,
      lockedUntil: row.locked_until,
      lastAction: row.last_action,
      online: row.online,
    }))
  }

  async clearLock(userId: string): Promise<void> {
    await this.prisma.securityFlag.updateMany({ where: { userId }, data: { lockedUntil: null } })
  }

  async clearFlag(userId: string): Promise<void> {
    await this.prisma.securityFlag.deleteMany({ where: { userId } })
  }

  async listAudit(page: number, perPage: number): Promise<{ rows: AuditRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.adminAudit.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.adminAudit.count(),
    ])
    return {
      rows: rows.map((row) => ({
        id: row.id.toString(),
        adminId: row.adminId,
        action: row.action,
        target: row.target,
        detail: row.detail,
        createdAt: row.createdAt,
      })),
      total,
    }
  }
}
