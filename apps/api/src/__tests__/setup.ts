import { randomUUID } from 'node:crypto'

import { afterAll, vi } from 'vitest'

import { createAuthServer } from '@/__tests__/helpers/auth-server'

import type { AuthServer } from '@/__tests__/helpers/auth-server'

declare global {
  var e2ePrefix: string
  var e2eAuth: AuthServer
}

for (const key of ['DATABASE_URL', 'REDIS_URL']) {
  const value = process.env[key]
  if (!value) throw new Error(`E2E test requires environment variable: ${key}`)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)) {
    throw new Error(`E2E test requires a loopback ${key}; remote services are not allowed`)
  }
}

globalThis.e2ePrefix = `e2e-${Date.now()}-${randomUUID().slice(0, 8)}`
globalThis.e2eAuth = await createAuthServer(globalThis.e2ePrefix)

Object.assign(process.env, {
  NODE_ENV: 'test',
  SUPABASE_URL: globalThis.e2eAuth.url,
  SUPABASE_SERVICE_ROLE_KEY: globalThis.e2eAuth.serviceKey,
  SUPABASE_JWT_ISSUER: `${globalThis.e2eAuth.url}/auth/v1`,
  SUPABASE_JWT_AUDIENCE: 'authenticated',
  STORAGE_DRIVER: 'supabase',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',
})

const originalFetch = globalThis.fetch
const unexpectedFetches: string[] = []
const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
  const url = new URL(input instanceof Request ? input.url : input.toString())
  if (url.origin !== globalThis.e2eAuth.url) {
    unexpectedFetches.push(url.origin)
    throw new Error('External HTTP is not allowed in API E2E tests')
  }
  return originalFetch(input, init)
})

afterAll(async () => {
  fetchSpy.mockRestore()
  await globalThis.e2eAuth.close()
  if (globalThis.e2eAuth.unexpectedRequests.length > 0 || unexpectedFetches.length > 0) {
    throw new Error('API E2E attempted an unexpected external request')
  }
})
