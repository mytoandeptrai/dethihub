import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AdminDocumentRow,
  StorageAdminRepositoryPort,
  StorageOverride,
  TopStorageUser,
} from '@/modules/storage/application/ports/storage-admin.repository.port'
import type { UserDocument } from '@workspace/database'

const toRow = (doc: UserDocument): AdminDocumentRow => ({
  id: doc.id,
  ownerId: doc.ownerId,
  name: doc.name,
  mime: doc.mime,
  size: Number(doc.size),
  url: doc.url,
  subject: doc.subject,
  createdAt: doc.createdAt,
})

@Injectable()
export class StorageAdminRepositoryImpl implements StorageAdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findOverride(userId: string): Promise<StorageOverride | null> {
    const row = await this.prisma.userQuota.findUnique({ where: { userId } })
    return row ? { maxBytes: Number(row.maxBytes), note: row.note } : null
  }

  async upsertOverride(userId: string, maxBytes: number, note: string | null): Promise<void> {
    await this.prisma.userQuota.upsert({
      where: { userId },
      create: { userId, maxBytes, note },
      update: { maxBytes, note },
    })
  }

  async deleteOverride(userId: string): Promise<void> {
    await this.prisma.userQuota.deleteMany({ where: { userId } })
  }

  async listDocuments(
    q: string,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminDocumentRow[]; total: number }> {
    const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {}
    const [docs, total] = await Promise.all([
      this.prisma.userDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.userDocument.count({ where }),
    ])
    return { rows: docs.map((doc) => toRow(doc)), total }
  }

  async topUsers(limit: number): Promise<TopStorageUser[]> {
    const rows = await this.prisma.userDocument.groupBy({
      by: ['ownerId'],
      _sum: { size: true },
      _count: { _all: true },
      orderBy: { _sum: { size: 'desc' } },
      take: limit,
    })
    return rows.map((row) => ({
      ownerId: row.ownerId,
      totalSize: Number(row._sum.size ?? 0),
      docCount: row._count._all,
    }))
  }

  async findDocument(id: string): Promise<AdminDocumentRow | null> {
    const doc = await this.prisma.userDocument.findUnique({ where: { id } })
    return doc ? toRow(doc) : null
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userDocument.deleteMany({ where: { id } })
  }

  async hasOtherWithUrl(url: string, exceptId: string): Promise<boolean> {
    return (await this.prisma.userDocument.count({ where: { url, id: { not: exceptId } } })) > 0
  }
}
