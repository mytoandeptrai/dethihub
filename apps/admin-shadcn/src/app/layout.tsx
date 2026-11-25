import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { appPaths } from '@/config/app-paths'
import { env } from '@/config/env'
import { site } from '@/config/site'
import { t } from '@/i18n/translate'
import { buildMetadata } from '@/lib/seo'

import { AppProvider } from './provide'

import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import '@/styles/product.css'

export const metadata: Metadata = {
  ...buildMetadata(),
  alternates: undefined,
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  applicationName: site.name,
  keywords: site.keywords,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: false, email: false, address: false },
  verification: { google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#312e81' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const messages = await getMessages()
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/*
          Product CSS (product-*.css) is scoped to html[data-product-shell]. useGlobalContainer sets that
          attribute in a useEffect, which only runs after JS loads and hydrates, so the server HTML painted
          unstyled first (visible on Vercel). This inline script sets it before first paint with the same
          rule (every page except the editor); the effect still handles client navigation and maintenance.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.pathname!==${JSON.stringify(appPaths.editor.href)})document.documentElement.dataset.productShell=''`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-3"
        >
          {t('common.skip')}
        </a>
        <NextIntlClientProvider locale="vi" messages={messages}>
          <AppProvider>{children}</AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
