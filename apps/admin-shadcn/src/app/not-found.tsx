import Link from 'next/link'

import { BackButton } from '@/components/back-button'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-dvh place-content-center gap-5 px-6 text-center">
      <p className="text-7xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">{t('common.notFound')}</h1>
      <p>{t('common.notFoundBody')}</p>
      <Link href={appPaths.home.href}>{t('common.home')}</Link>
      <BackButton />
    </main>
  )
}
