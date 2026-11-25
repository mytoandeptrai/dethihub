import { fileURLToPath } from 'node:url'

import { defineConfig } from '@playwright/test'

const cwd = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  testDir: '.',
  testMatch: 'seo.spec.ts',
  workers: 1,
  reporter: 'line',
  use: { baseURL: process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8092' },
  webServer: [
    {
      cwd,
      command: 'node e2e/fixtures/seo-api.mjs',
      url: 'http://127.0.0.1:3302/api/billing/pricing',
      reuseExistingServer: !process.env.CI,
    },
    {
      cwd,
      command: 'pnpm start --port 8092',
      url: 'http://localhost:8092',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
