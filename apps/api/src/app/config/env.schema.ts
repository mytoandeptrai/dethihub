import { z } from 'zod'

/**
 * Environment variable schema definition
 *
 * Uses Zod for type-safe environment variable validation
 */
const nonNegativeNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return value !== undefined && value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : fallback
}

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)

export const envSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Application port
  PORT: z
    .string()
    .default('3000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0 && value < 65_536, {
      message: 'PORT must be between 1 and 65535',
    }),

  // Database connection string
  DATABASE_URL: z.url().default('postgres://postgres:postgres@localhost:5432/vsa_m_nest'),

  // Direct (session) connection used only by `prisma migrate deploy`
  DIRECT_URL: z.url().optional(),

  // Database connection pool configuration
  DB_POOL_MAX: z
    .string()
    .default('20')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0 && value <= 100, {
      message: 'DB_POOL_MAX must be between 1 and 100',
    }),

  DB_POOL_MIN: z
    .string()
    .default('5')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value >= 0 && value <= 50, {
      message: 'DB_POOL_MIN must be between 0 and 50',
    }),

  DB_POOL_IDLE_TIMEOUT: z
    .string()
    .default('30000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value >= 1000, {
      message: 'DB_POOL_IDLE_TIMEOUT must be at least 1000ms',
    }),

  DB_POOL_CONNECTION_TIMEOUT: z
    .string()
    .default('10000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value >= 1000, {
      message: 'DB_POOL_CONNECTION_TIMEOUT must be at least 1000ms',
    }),

  // JWT configuration
  JWT_SECRET: z
    .string()
    .min(32, {
      message: 'JWT_SECRET must be at least 32 characters long (use a randomly generated key)',
    })
    .default('your-secret-key-change-me-in-production-min-32-chars'),

  JWT_EXPIRES_IN: z
    .string()
    .default('15m')
    .refine((value) => /^\d+[smhd]$/.test(value), {
      message: 'JWT_EXPIRES_IN format is invalid (e.g. 60s, 15m, 2h, 7d)',
    }),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((value) => /^\d+[smhd]$/.test(value), {
      message: 'JWT_REFRESH_EXPIRES_IN format is invalid (e.g. 60s, 15m, 2h, 7d)',
    }),

  // Supabase (Auth only: JWKS verification and the Auth Admin API)
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_ISSUER: z.url().optional(),
  SUPABASE_JWT_AUDIENCE: z.string().default('authenticated'),
  // Labels for the admin database card; the metrics endpoint does not report them
  SUPABASE_REGION: z.string().default('ap-southeast-1'),
  SUPABASE_COMPUTE: z.string().default('Nano'),

  // Object storage backend
  STORAGE_DRIVER: z.enum(['supabase', 'r2']).default('supabase'),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('dethihub'),

  // Secret for private document keys; falls back to SUPABASE_SERVICE_ROLE_KEY
  DOC_KEY_SECRET: z.string().optional(),

  // Cloudflare R2 (used when STORAGE_DRIVER=r2)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  // Per-account storage cap in bytes when no per-user override exists
  STORAGE_MAX_BYTES: z
    .string()
    .optional()
    .transform((value) => {
      const parsed = nonNegativeNumber(value, 10 * 1024 * 1024)
      return parsed > 0 ? parsed : 10 * 1024 * 1024
    }),

  // AI points (1 point = 1,000 tokens); empty or invalid falls back to the default
  AI_WELCOME_POINTS: z
    .string()
    .optional()
    .transform((value) => nonNegativeNumber(value, 80)),
  AI_MONTHLY_TOKENS: z
    .string()
    .optional()
    .transform((value) => nonNegativeNumber(value, 0)),
  AI_RECEIPT_SECRET: z.string().optional(),

  // Image generation: Agnes answers directly, the second provider answers with a job to poll
  AI_IMAGE_POINTS: z
    .string()
    .optional()
    .transform((value) => nonNegativeNumber(value, 5)),
  AGNES_API_KEY: optionalText,
  AGNES_BASE_URL: optionalText,
  AGNES_IMAGE_MODEL: optionalText,
  IMAGE_API_KEY: optionalText,
  IMAGE_BASE_URL: optionalText,
  IMAGE_MODEL: optionalText,

  // PayOS: the three keys come from one payment channel; any missing key closes payments
  PAYOS_CLIENT_ID: optionalText,
  PAYOS_API_KEY: optionalText,
  PAYOS_CHECKSUM_KEY: optionalText,
  PAYOS_BASE_URL: z.url().default('https://api-merchant.payos.vn'),
  PUBLIC_SITE_URL: z.url().default('http://localhost:8080'),

  // LLM providers: an empty key disables the provider; base URL and model fall back to code defaults
  LLM_API_KEY: optionalText,
  LLM_BASE_URL: optionalText,
  LLM_MODEL: optionalText,
  LLM_FALLBACK_MODEL: optionalText,
  LLM_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((value) => {
      const parsed = nonNegativeNumber(value, 250_000)
      return parsed >= 10_000 ? parsed : 250_000
    }),
  STRONG_POINT_FACTOR: z
    .string()
    .optional()
    .transform((value) => {
      const parsed = nonNegativeNumber(value, 3)
      return parsed >= 1 && parsed <= 10 ? parsed : 3
    }),
  DEEPSEEK_API_KEY: optionalText,
  DEEPSEEK_BASE_URL: optionalText,
  DEEPSEEK_MODEL: optionalText,
  DEEPSEEK_STRONG_MODEL: optionalText,
  GEMINI_API_KEY: optionalText,
  GEMINI_BASE_URL: optionalText,
  GEMINI_MODEL: optionalText,
  FOSTA_API_KEY: optionalText,
  FOSTA_BASE_URL: optionalText,
  FOSTA_MODEL: optionalText,
  ANYROUTER_API_KEY: optionalText,
  ANYROUTER_BASE_URL: optionalText,
  ANYROUTER_MODEL: optionalText,
  NIGHTROUTER_API_KEY: optionalText,
  NIGHTROUTER_BASE_URL: optionalText,
  NIGHTROUTER_MODEL: optionalText,
  ANTHROPIC_API_KEY: optionalText,
  ANTHROPIC_BASE_URL: optionalText,
  ANTHROPIC_MODEL: optionalText,
  AI_SETTINGS_SECRET: optionalText,
  AI_ENDPOINT_ALLOWED_HOSTS: optionalText,

  // CORS configuration
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Redis configuration (supports redis:// and rediss:// for TLS encrypted connections)
  REDIS_URL: z
    .string()
    .refine((value) => /^rediss?:\/\/.+/.test(value), {
      message: 'REDIS_URL must start with redis:// or rediss://',
    })
    .default('redis://localhost:6379'),

  REDIS_TTL: z
    .string()
    .default('3600')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, {
      message: 'REDIS_TTL must be greater than 0',
    }),

  // API base URL (used as the type URI for RFC 9457 Problem Details)
  API_BASE_URL: z.url().default('https://api.example.com'),

  // OAuth configuration (optional; OAuth login is disabled when not set)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_BASE_URL: z.url().default('http://localhost:3000/api/auth/oauth'),
  FRONTEND_URL: z.url().default('http://localhost:3001'),

  // Rate limiting configuration (tighten in production; no limit if unset in local/CI)
  THROTTLE_TTL: z
    .string()
    .default('60000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, { message: 'THROTTLE_TTL must be greater than 0' }),

  THROTTLE_LIMIT: z
    .string()
    .default('100000')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0, { message: 'THROTTLE_LIMIT must be greater than 0' }),
})

/**
 * Environment variable type
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 *
 * @throws {z.ZodError} if environment variable validation fails
 */
export function validateEnv(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((error_: z.core.$ZodIssue) => `${error_.path.join('.')}: ${error_.message}`)
        .join('\n')

      throw new Error(
        `Environment variable validation failed:\n${errorMessages}\n\nPlease check your .env file or environment variable configuration`,
        { cause: error },
      )
    }
    throw error
  }
}
