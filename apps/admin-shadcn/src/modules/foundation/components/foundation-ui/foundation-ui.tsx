import { Button } from '@workspace/ui/components/button'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'

import type { useFoundationContainer } from '@/modules/foundation/hooks'

type FoundationUiProps = ReturnType<typeof useFoundationContainer>

const FoundationUi = ({ t, title, isHome, email, isStaff, onSignOut }: FoundationUiProps) => (
  <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-8">
    <header className="flex flex-wrap items-center justify-between gap-5 border-b pb-6">
      <Link href={appPaths.home.href} className="flex items-center gap-2 text-xl font-semibold">
        <BookOpen className="size-6 text-primary" />
        {t('brand')}
      </Link>
      <nav className="flex flex-wrap items-center gap-5 text-sm">
        {email ? (
          <>
            <Link href={appPaths.profile.href}>{t('profile')}</Link>
            <Link href={appPaths.profile.uploads.href}>{t('uploads')}</Link>
            {isStaff && <Link href={appPaths.admin.href}>{t('admin')}</Link>}
            <Button variant="outline" onClick={onSignOut}>
              {t('signOut')}
            </Button>
          </>
        ) : (
          <Link href={appPaths.auth.login.href}>{t('foundation')}</Link>
        )}
      </nav>
    </header>
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
  </main>
)
export default FoundationUi
