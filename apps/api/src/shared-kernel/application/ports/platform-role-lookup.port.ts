import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

export const PLATFORM_ROLE_LOOKUP = Symbol('PLATFORM_ROLE_LOOKUP')

export interface PlatformRoleLookupPort {
  getRole(userId: string): Promise<PlatformRole | null>
}
