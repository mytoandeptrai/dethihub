/**
 * E2E test global setup file
 * Executed before all tests run
 */

import { beforeAll } from 'vitest'

process.loadEnvFile('.env')

declare global {
  var e2ePrefix: string
}

beforeAll(() => {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`E2E test requires environment variable: ${key}`)
    }
  }

  // Generate a timestamp-based prefix for email namespace isolation across E2E suites
  globalThis.e2ePrefix = `e2e-${Date.now()}`
})
