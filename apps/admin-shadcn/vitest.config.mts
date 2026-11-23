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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engine-pricing': fileURLToPath(new URL('./src/engine/compat/pricing.ts', import.meta.url)),
      '@engine-dialogs': fileURLToPath(new URL('./src/engine/compat/dialogs.ts', import.meta.url)),
      '@engine-designs': fileURLToPath(new URL('./src/engine/compat/designs.ts', import.meta.url)),
      '@engine-navigation': fileURLToPath(new URL('./src/engine/compat/navigation.ts', import.meta.url)),
      '@workspace-engine': fileURLToPath(new URL('./src/engine/compat/workspace.ts', import.meta.url)),
    },
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
