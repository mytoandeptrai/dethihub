import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AuthenticationService } from '@/modules/access-control/application/services/authentication.service'
import { IS_PUBLIC_KEY } from '@/shared-kernel/infrastructure/decorators/public.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authentication: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: AuthenticatedUser }>()

    const user = await this.authentication.authenticate(request.headers.authorization)
    if (user) request.user = user
    if (!user && !isPublic) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_MISSING, message: 'Cần đăng nhập.' })
    }
    return true
  }
}
