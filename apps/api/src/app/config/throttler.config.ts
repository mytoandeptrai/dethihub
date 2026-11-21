import {
  RATE_LIMIT_KEY,
  RATE_LIMIT_NAMES,
} from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { Env } from '@/app/config/env.schema'
import type { RateLimitName } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { ExecutionContext } from '@nestjs/common'
import type { ThrottlerModuleOptions } from '@nestjs/throttler'

const WINDOW_MS = 10 * 60 * 1000

/** Hits per window as [guest, signed-in user] */
export const RATE_LIMITS: Record<RateLimitName, readonly [number, number]> = {
  llm: [20, 300],
  image: [3, 40],
  upload: [20, 300],
  extract: [20, 200],
  attempt: [500, 500],
  exam: [1000, 1000],
  admin: [20, 600],
  pay: [10, 120],
  workspace: [0, 600],
}

interface TrackedRequest {
  ip?: string
  user?: AuthenticatedUser
}

export const limitFor = (name: RateLimitName, authenticated: boolean): number =>
  RATE_LIMITS[name][authenticated ? 1 : 0]

export const trackerFor = (request: TrackedRequest): string =>
  request.user ? `user:${request.user.id}` : `ip:${request.ip ?? ''}`

const routeLimitName = (context: ExecutionContext): RateLimitName | undefined =>
  (Reflect.getMetadata(RATE_LIMIT_KEY, context.getHandler()) as RateLimitName | undefined) ??
  (Reflect.getMetadata(RATE_LIMIT_KEY, context.getClass()) as RateLimitName | undefined)

export function createThrottlerOptions(
  env: Pick<Env, 'THROTTLE_TTL' | 'THROTTLE_LIMIT'>,
): ThrottlerModuleOptions {
  return {
    getTracker: (request) => trackerFor(request as TrackedRequest),
    throttlers: [
      { name: 'default', ttl: env.THROTTLE_TTL, limit: env.THROTTLE_LIMIT },
      ...RATE_LIMIT_NAMES.map((name) => ({
        name,
        ttl: WINDOW_MS,
        limit: (context: ExecutionContext) =>
          limitFor(name, Boolean(context.switchToHttp().getRequest<TrackedRequest>().user)),
        // Each named bucket only applies to routes tagged with @RateLimit(name)
        skipIf: (context: ExecutionContext) => routeLimitName(context) !== name,
      })),
    ],
  }
}
