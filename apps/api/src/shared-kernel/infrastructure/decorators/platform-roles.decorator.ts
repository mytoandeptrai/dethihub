import { SetMetadata } from '@nestjs/common'

import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

export const PLATFORM_ROLE_KEY = 'platformRole'

export const PlatformRoles = (required: PlatformRole) => SetMetadata(PLATFORM_ROLE_KEY, required)
