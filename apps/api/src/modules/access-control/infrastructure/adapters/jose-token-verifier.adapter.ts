import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createRemoteJWKSet, errors, jwtVerify } from 'jose'

import type { Env } from '@/app/config/env.schema'
import type {
  TokenVerifier,
  VerifiedToken,
} from '@/modules/access-control/application/ports/token-verifier.port'

@Injectable()
export class JoseTokenVerifier implements TokenVerifier {
  readonly #jwks: ReturnType<typeof createRemoteJWKSet>
  readonly #issuer: string
  readonly #audience: string

  constructor(config: ConfigService<Env, true>) {
    const baseUrl = config.get('SUPABASE_URL', { infer: true }).replace(/\/+$/, '')
    this.#issuer = config.get('SUPABASE_JWT_ISSUER', { infer: true }) ?? `${baseUrl}/auth/v1`
    this.#audience = config.get('SUPABASE_JWT_AUDIENCE', { infer: true })
    this.#jwks = createRemoteJWKSet(new URL(`${baseUrl}/auth/v1/.well-known/jwks.json`), {
      timeoutDuration: 3000,
      cooldownDuration: 60_000,
      cacheMaxAge: 600_000,
    })
  }

  async verify(token: string): Promise<VerifiedToken | null> {
    try {
      const { payload } = await jwtVerify(token, this.#jwks, {
        issuer: this.#issuer,
        audience: this.#audience,
        algorithms: ['ES256', 'RS256'],
      })
      if (payload.role !== 'authenticated' || !payload.sub) return null
      return {
        userId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
      }
    } catch (error) {
      if (isInvalidToken(error)) return null
      throw error
    }
  }
}

// A failed JWKS fetch surfaces as a timeout, a generic JOSE error or a non-JOSE error; none of them says the token is bad
function isInvalidToken(error: unknown): boolean {
  return (
    error instanceof errors.JOSEError &&
    !(error instanceof errors.JWKSTimeout) &&
    error.code !== 'ERR_JOSE_GENERIC'
  )
}
