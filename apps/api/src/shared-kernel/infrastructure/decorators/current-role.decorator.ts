import { createParamDecorator } from '@nestjs/common'

import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'
import type { ExecutionContext } from '@nestjs/common'

/** The caller's platform role, set by PlatformRolesGuard on routes guarded by @PlatformRoles */
export const CurrentRole = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ platformRole?: PlatformRole }>()
  return request.platformRole
})
