'use client'

import { Button } from '@workspace/ui/components/button'

import Link from '@/components/navigation-link'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content" className="grid min-h-dvh place-content-center gap-5 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t('common.error')}</h1>
      <p>{error.message || t('common.requestError')}</p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>{t('common.retry')}</Button>
        <Link href={appPaths.home.href}>{t('common.home')}</Link>
      </div>
    </main>
  )
}
