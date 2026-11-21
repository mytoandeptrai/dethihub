import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '@/app/database/prisma.service'

import type { Env } from '@/app/config/env.schema'
import type {
  NewDocument,
  ReserveDocumentResult,
  StorageUsage,
  UserDocumentRecord,
  UserDocumentRepositoryPort,
} from '@/modules/storage/application/ports/user-document.repository.port'
import type { Prisma, UserDocument } from '@workspace/database'

interface UsageRow {
  used: bigint
  max: bigint
}

interface KindRow {
  kind: string
  n: bigint
  bytes: bigint
}

const KIND_LIMITS: Record<string, number> = { doc: 100, deck: 50, board: 30 }

const toRecord = (row: UserDocument): UserDocumentRecord => ({
  id: row.id,
  name: row.name,
  mime: row.mime,
  size: Number(row.size),
  url: row.url,
  subject: row.subject,
  createdAt: row.createdAt,
})

@Injectable()
export class UserDocumentRepositoryImpl implements UserDocumentRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  reserve(
    ownerId: string,
    input: NewDocument,
    check: (used: number, max: number, size: number) => string | null,
  ): Promise<ReserveDocumentResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`storage:${ownerId}`}))`
      const row = await this.measure(tx, ownerId)

      const violation = check(Number(row.used), Number(row.max), input.size)
      if (violation) return { violation }

      const created = await tx.userDocument.create({
        data: { ownerId, ...input, size: BigInt(input.size) },
      })
      return { document: toRecord(created) }
    })
  }

  async list(ownerId: string): Promise<UserDocumentRecord[]> {
    const rows = await this.prisma.userDocument.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => toRecord(row))
  }

  async findOwned(ownerId: string, id: string): Promise<UserDocumentRecord | null> {
    const row = await this.prisma.userDocument.findFirst({ where: { id, ownerId } })
    return row ? toRecord(row) : null
  }

  async hasOtherWithUrl(ownerId: string, url: string, exceptId: string): Promise<boolean> {
    const count = await this.prisma.userDocument.count({
      where: { ownerId, url, id: { not: exceptId } },
      take: 1,
    })
    return count > 0
  }

  async ownsUrl(ownerId: string, url: string): Promise<boolean> {
    const count = await this.prisma.userDocument.count({ where: { ownerId, url }, take: 1 })
    return count > 0
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.prisma.userDocument.deleteMany({ where: { id, ownerId } })
  }

  async usage(ownerId: string): Promise<StorageUsage> {
    const usage = await this.measure(this.prisma, ownerId)
    const kinds = await this.prisma.$queryRaw<KindRow[]>`
      SELECT kind, count(*) AS n, coalesce(sum(bytes), 0) AS bytes
      FROM user_items WHERE owner_id = ${ownerId}::uuid GROUP BY kind`
    const files = await this.prisma.userDocument.aggregate({
      where: { ownerId },
      _count: true,
      _sum: { size: true },
    })

    const result: StorageUsage['kinds'] = {}
    for (const row of kinds) {
      result[row.kind] = {
        count: Number(row.n),
        bytes: Number(row.bytes),
        limit: KIND_LIMITS[row.kind] ?? null,
      }
    }
    if (files._count > 0) {
      result.files = { count: files._count, bytes: Number(files._sum.size ?? 0), limit: null }
    }
    return { used: Number(usage.used), max: Number(usage.max), kinds: result }
  }

  private async measure(client: Prisma.TransactionClient, ownerId: string): Promise<UsageRow> {
    const defaultMax = this.config.get('STORAGE_MAX_BYTES', { infer: true })
    const [row] = await client.$queryRaw<UsageRow[]>`
      SELECT
        (SELECT coalesce(sum(bytes), 0) FROM user_items WHERE owner_id = ${ownerId}::uuid)
          + (SELECT coalesce(sum(size), 0) FROM user_documents WHERE owner_id = ${ownerId}::uuid) AS used,
        coalesce(
          (SELECT max_bytes FROM user_quota WHERE user_id = ${ownerId}::uuid),
          ${defaultMax}::bigint
        ) AS max`
    if (!row) throw new Error('Storage measurement returned no row')
    return row
  }
}
