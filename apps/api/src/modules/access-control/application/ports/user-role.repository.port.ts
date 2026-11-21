import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

export const USER_ROLE_REPOSITORY = Symbol('USER_ROLE_REPOSITORY')

export interface UserRoleRepositoryPort {
  findRole(userId: string): Promise<PlatformRole | null>
}
