import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AdminAuditEntry,
  AdminAuditRepository,
} from '@/modules/access-control/application/ports/admin-audit.repository.port'
import type { Prisma } from '@workspace/database'

@Injectable()
export class PrismaAdminAuditRepository implements AdminAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AdminAuditEntry): Promise<void> {
    await this.prisma.adminAudit.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        target: entry.target,
        detail: entry.detail as Prisma.InputJsonObject,
      },
    })
  }
}
