import { SetMetadata } from '@nestjs/common'

export const RATE_LIMIT_NAMES = [
  'llm',
  'image',
  'upload',
  'extract',
  'attempt',
  'attempt-exam',
  'exam',
  'admin',
  'pay',
  'workspace',
] as const

export type RateLimitName = (typeof RATE_LIMIT_NAMES)[number]

export const RATE_LIMIT_KEY = 'rateLimitName'

export const RateLimit = (...names: RateLimitName[]) => SetMetadata(RATE_LIMIT_KEY, names)
