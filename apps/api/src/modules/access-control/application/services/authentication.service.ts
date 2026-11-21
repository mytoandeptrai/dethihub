import { ForbiddenException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'

import { TOKEN_VERIFIER } from '@/modules/access-control/application/ports/token-verifier.port'
import { AUTH_USER_DIRECTORY } from '@/shared-kernel/application/ports/auth-user-directory.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { TokenVerifier } from '@/modules/access-control/application/ports/token-verifier.port'
import type { AuthUserDirectory } from '@/shared-kernel/application/ports/auth-user-directory.port'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const MAX_TOKEN_LENGTH = 4096
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/
const BEARER_PREFIX = /^Bearer\s+/i

export const BANNED_MESSAGE = 'Tài khoản đang bị khoá.'
export const TOKEN_BUSY_MESSAGE =
  'Hệ thống đang bận kiểm tra đăng nhập, vui lòng thử lại sau ít giây.'

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
    @Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectory,
  ) {}

  /** null = guest (no token or an invalid one); throws 403 for a banned account and 503 when it cannot be checked */
  async authenticate(authorization: string | undefined): Promise<AuthenticatedUser | null> {
    const token = authorization?.replace(BEARER_PREFIX, '').trim()
    if (!token || token.length > MAX_TOKEN_LENGTH || !JWT_SHAPE.test(token)) return null

    const verified = await this.verifier.verify(token).catch(() => this.busy())
    if (!verified) return null

    const banned = await this.directory.isBanned(verified.userId).catch(() => this.busy())
    if (banned) {
      throw new ForbiddenException({ code: ErrorCode.ACCOUNT_BANNED, message: BANNED_MESSAGE })
    }
    return { id: verified.userId, email: verified.email }
  }

  private busy(): never {
    throw new ServiceUnavailableException({
      code: ErrorCode.TOKEN_BUSY,
      message: TOKEN_BUSY_MESSAGE,
    })
  }
}
