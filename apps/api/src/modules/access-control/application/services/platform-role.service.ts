import { Inject, Injectable } from '@nestjs/common'

import { USER_ROLE_REPOSITORY } from '@/modules/access-control/application/ports/user-role.repository.port'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'
import { isPlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

import type { UserRoleRepository } from '@/modules/access-control/application/ports/user-role.repository.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

const ROLE_CACHE_TTL_SECONDS = 60
const NO_ROLE = ''

@Injectable()
export class PlatformRoleService {
  constructor(
    @Inject(USER_ROLE_REPOSITORY) private readonly roles: UserRoleRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async getRole(userId: string, options: { fresh?: boolean } = {}): Promise<PlatformRole | null> {
    const key = `platform:role:${userId}`
    if (!options.fresh) {
      const cached = await this.cache.get<string>(key)
      if (cached !== undefined) return isPlatformRole(cached) ? cached : null
    }
    const role = await this.roles.findRole(userId)
    await this.cache.set(key, role ?? NO_ROLE, ROLE_CACHE_TTL_SECONDS)
    return role
  }
}
