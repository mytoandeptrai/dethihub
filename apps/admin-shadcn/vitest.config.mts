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
      'server-only': fileURLToPath(
        new URL('./node_modules/next/dist/compiled/server-only/empty.js', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@editor-engine': fileURLToPath(
        new URL('./src/engine/compat/editor-root.tsx', import.meta.url),
      ),
      '@engine-pricing': fileURLToPath(new URL('./src/engine/compat/pricing.ts', import.meta.url)),
      '@engine-dialogs': fileURLToPath(new URL('./src/engine/compat/dialogs.ts', import.meta.url)),
      '@engine-designs': fileURLToPath(new URL('./src/engine/compat/designs.ts', import.meta.url)),
      '@engine-navigation': fileURLToPath(
        new URL('./src/engine/compat/navigation.ts', import.meta.url),
      ),
      '@workspace-engine': fileURLToPath(
        new URL('./src/engine/compat/workspace.ts', import.meta.url),
      ),
      '@online-exams-engine': fileURLToPath(
        new URL('./src/engine/compat/online-exams.ts', import.meta.url),
      ),
      '@student-engine': fileURLToPath(
        new URL('./src/engine/compat/student-exams.ts', import.meta.url),
      ),
      '@profile-engine': fileURLToPath(new URL('./src/engine/compat/profile.ts', import.meta.url)),
      '@admin-pages-engine': fileURLToPath(
        new URL('./src/engine/compat/admin-pages.ts', import.meta.url),
      ),
      '@admin-overlays-engine': fileURLToPath(
        new URL('./src/engine/compat/admin-overlays.ts', import.meta.url),
      ),
      '@library-engine': fileURLToPath(new URL('./src/engine/compat/library.ts', import.meta.url)),
      '@community-engine': fileURLToPath(
        new URL('./src/engine/compat/community.ts', import.meta.url),
      ),
      '@product-ui-engine': fileURLToPath(
        new URL('./src/engine/compat/product-ui.ts', import.meta.url),
      ),
      '@student-kernel': fileURLToPath(
        new URL('./src/engine/compat/student-kernel.tsx', import.meta.url),
      ),
      '@online-exams-kernel': fileURLToPath(
        new URL('./src/engine/compat/online-exams-kernel.ts', import.meta.url),
      ),
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
