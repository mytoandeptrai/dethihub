import path from 'node:path'

import createNextIntlPlugin from 'next-intl/plugin'

import { legacyRedirects } from './src/config/legacy-paths'

import type { NextConfig } from 'next'

const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
const supabaseOrigin = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
)
const remotePattern = (url: URL) => ({
  protocol: url.protocol.slice(0, -1) as 'http' | 'https',
  hostname: url.hostname,
  port: url.port,
})

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@workspace/ui'],
  images: {
    remotePatterns: [remotePattern(apiOrigin), remotePattern(supabaseOrigin)],
  },
  async rewrites() {
    return [{ source: '/api/files/:path*', destination: apiOrigin.origin + '/api/files/:path*' }]
  },
  async redirects() {
    return legacyRedirects
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
    resolveAlias: {
      '@editor-engine': './src/engine/compat/editor-root.tsx',
      '@engine-pricing': './src/engine/compat/pricing.ts',
      '@engine-dialogs': './src/engine/compat/dialogs.ts',
      '@engine-designs': './src/engine/compat/designs.ts',
      '@engine-navigation': './src/engine/compat/navigation.ts',
      '@workspace-engine': './src/engine/compat/workspace.ts',
      '@online-exams-engine': './src/engine/compat/online-exams.ts',
      '@student-engine': './src/engine/compat/student-exams.ts',
      '@profile-engine': './src/engine/compat/profile.ts',
      '@admin-pages-engine': './src/engine/compat/admin-pages.ts',
      '@admin-overlays-engine': './src/engine/compat/admin-overlays.ts',
      '@library-engine': './src/engine/compat/library.ts',
      '@community-engine': './src/engine/compat/community.ts',
      '@product-ui-engine': './src/engine/compat/product-ui.ts',
      '@student-kernel': './src/engine/compat/student-kernel.tsx',
      '@online-exams-kernel': './src/engine/compat/online-exams-kernel.ts',
    },
  },
  headers() {
    return [
      {
        source:
          '/:path(admin|editor|my-docs|online-exams|library|profile|grading|play|quiz|auth|forgot-password|reset-password)/:rest*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig)
