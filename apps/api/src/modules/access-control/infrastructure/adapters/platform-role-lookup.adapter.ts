import { Injectable } from '@nestjs/common'

import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'

import type { PlatformRoleLookupPort } from '@/shared-kernel/application/ports/platform-role-lookup.port'
import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

@Injectable()
export class PlatformRoleLookupAdapter implements PlatformRoleLookupPort {
  constructor(private readonly roles: PlatformRoleService) {}

  getRole(userId: string): Promise<PlatformRole | null> {
    return this.roles.getRole(userId)
  }
}
