import Link from 'next/link'

import { appPaths } from '@/config/app-paths'

import type { useFoundationContainer } from '@/modules/foundation/hooks'

type FoundationUiProps = ReturnType<typeof useFoundationContainer>

const FoundationUi = ({ t, title, isHome, email }: FoundationUiProps) => (
  <div className="mx-auto w-full max-w-6xl px-6 py-8">
    <section className="grid min-h-80 content-center gap-5 py-16">
      <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{isHome ? t('description') : email}</p>
      {isHome ? (
        <Link
          href={appPaths.auth.register.href}
          className="w-fit rounded-lg bg-primary px-5 py-3 text-primary-foreground"
        >
          {t('foundation')}
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">{t('comingSoon')}</p>
      )}
    </section>
  </div>
)
export default FoundationUi
