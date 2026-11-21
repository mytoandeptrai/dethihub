import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '@/app/database/prisma.service'

import type { Env } from '@/app/config/env.schema'
import type {
  SaveItemResult,
  StoredItem,
  WorkspaceItemRepositoryPort,
} from '@/modules/workspace/application/ports/workspace-item.repository.port'
import type { ItemKind } from '@/modules/workspace/domain/enums/item-kind.enum'
import type { ItemQuotaSnapshot } from '@/modules/workspace/domain/policies/item-quota.policy'
import type { Prisma } from '@workspace/database'

interface SizeRow {
  newBytes: bigint
  oldBytes: bigint | null
  kindCount: bigint
  used: bigint
  max: bigint
}

@Injectable()
export class WorkspaceItemRepositoryImpl implements WorkspaceItemRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async list(ownerId: string, kind: ItemKind): Promise<StoredItem[]> {
    const rows = await this.prisma.userItem.findMany({
      where: { ownerId, kind },
      select: { id: true, data: true },
    })
    return rows.map((row) => ({ id: row.id, data: row.data as Record<string, unknown> }))
  }

  saveWithinQuota(
    ownerId: string,
    kind: ItemKind,
    id: string,
    data: Record<string, unknown>,
    check: (snapshot: ItemQuotaSnapshot) => string | null,
  ): Promise<SaveItemResult> {
    const defaultMax = this.config.get('STORAGE_MAX_BYTES', { infer: true })
    const json = JSON.stringify(data)
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`storage:${ownerId}`}))`
      // Postgres measures the size: jsonb text is normalised, so its length differs from JSON.stringify
      const [row] = await tx.$queryRaw<SizeRow[]>`
        SELECT
          octet_length(${json}::jsonb::text) AS "newBytes",
          (SELECT bytes FROM user_items
            WHERE owner_id = ${ownerId}::uuid AND kind = ${kind} AND id = ${id}) AS "oldBytes",
          (SELECT count(*) FROM user_items
            WHERE owner_id = ${ownerId}::uuid AND kind = ${kind}) AS "kindCount",
          (SELECT coalesce(sum(bytes), 0) FROM user_items WHERE owner_id = ${ownerId}::uuid)
            + (SELECT coalesce(sum(size), 0) FROM user_documents WHERE owner_id = ${ownerId}::uuid) AS "used",
          coalesce(
            (SELECT max_bytes FROM user_quota WHERE user_id = ${ownerId}::uuid),
            ${defaultMax}::bigint
          ) AS "max"`
      if (!row) throw new Error('Storage measurement returned no row')

      const violation = check({
        kind,
        newBytes: Number(row.newBytes),
        oldBytes: row.oldBytes === null ? null : Number(row.oldBytes),
        kindCount: Number(row.kindCount),
        used: Number(row.used),
        max: Number(row.max),
      })
      if (violation) return { violation }

      // The update branch leaves created_at alone, so the original creation date survives
      await tx.userItem.upsert({
        where: { ownerId_kind_id: { ownerId, kind, id } },
        create: { ownerId, kind, id, data: data as Prisma.InputJsonObject },
        update: { data: data as Prisma.InputJsonObject },
      })
      return { saved: true as const }
    })
  }

  async deleteMany(ownerId: string, kind: ItemKind, ids: string[]): Promise<void> {
    await this.prisma.userItem.deleteMany({ where: { ownerId, kind, id: { in: ids } } })
  }
}
