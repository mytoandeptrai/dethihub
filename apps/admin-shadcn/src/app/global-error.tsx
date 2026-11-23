'use client'

import { t } from '@/i18n/translate'
import '@/styles/globals.css'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <main
          id="main-content"
          className="grid min-h-dvh place-content-center gap-4 px-6 text-center"
        >
          <h1>{t('common.criticalError')}</h1>
          <p>{error.message || t('common.requestError')}</p>
          <button onClick={reset}>{t('common.retry')}</button>
        </main>
      </body>
    </html>
  )
}
