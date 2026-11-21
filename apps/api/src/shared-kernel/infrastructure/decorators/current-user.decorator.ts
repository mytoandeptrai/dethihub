import { createParamDecorator } from '@nestjs/common'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
  return request.user
})
