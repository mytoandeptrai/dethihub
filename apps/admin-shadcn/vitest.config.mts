import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-publishable-key'

const sharedConfig = {
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}

const sharedTestConfig = {
  globals: false,
  setupFiles: ['./src/testing/setup.ts'],
  environment: 'jsdom' as const,
}

export default defineConfig({
  ...sharedConfig,
  test: {
    ...sharedTestConfig,
    include: ['src/**/*.test.{ts,tsx}', 'postcss.engine.test.ts'],
  },
})
