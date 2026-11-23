import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { appPaths } from '@/config/app-paths'
import { env } from '@/config/env'
import { t } from '@/i18n/translate'

import { AppProvider } from './provide'

import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/product.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: t('common.brand'), template: `%s | ${t('common.brand')}` },
  description: t('common.description'),
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
