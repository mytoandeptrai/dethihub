import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { isPlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

import type { UserRoleRepository } from '@/modules/access-control/application/ports/user-role.repository.port'
import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

@Injectable()
export class PrismaUserRoleRepository implements UserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRole(userId: string): Promise<PlatformRole | null> {
    const row = await this.prisma.appUserRole.findUnique({ where: { userId } })
    return isPlatformRole(row?.role) ? row.role : null
  }
}
