'use client'
import { Link, Navigate } from '@profile-engine'
import { ChevronRight, FileText, LogOut, Shield } from 'lucide-react'

import {
  Avatar,
  SiteButton as Button,
  Card,
  inputClass,
  PageHeader,
  PageShell,
  ProgressBar,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { FormSkeleton, LoadingRegion, PageSkeleton } from '@/components/page-skeleton'
import { ProfileModel } from '@/modules/profile/hooks'

import type {
  ProfileParts as Imported0,
  ProfileParts as Imported1,
  ProfileParts as Imported2,
  ProfileParts as Imported3,
  ProfileParts as Imported4,
  ProfileParts as Imported5,
  ProfileParts as Imported6,
} from '@/modules/profile/containers/profile-container/profile-container'
const { fmt, EVENT_LABELS } = ProfileModel
export function ProfileProfileUi(
  props: ReturnType<typeof ProfileModel.useProfileContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 2) return <PageSkeleton variant="detail" />
  const { ProfilePage } = props.parts
  if (props.viewState === 0) {
    return <Navigate to={appPaths.auth.login.href} replace />
  }
  if (props.viewState === 1) {
    const { session } = props
    return <ProfilePage user={session.user} />
  }
  return null
}
export function ProfileProfilePageUi(
  props: ReturnType<typeof ProfileModel.useProfilePageContainer> & {
    parts: typeof Imported1
  },
) {
  const { AdminCard, IdentityCard, EditCard, CreditCard } = props.parts
  if (props.viewState === 0) {
    const { user } = props
    return (
      <PageShell>
        <PageHeader title={t('profileCopy.m21')} />
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="anim-rise lg:sticky lg:top-24 lg:self-start">
            <IdentityCard user={user} />
            <Link
              to={appPaths.profile.uploads.href}
              className="mt-3 flex items-center gap-3 rounded-[8px] bg-surface px-4 py-3 shadow-lift transition-colors hover:bg-paper-2"
            >
              <FileText className="size-4 text-ink-3" />
              <span className="flex-1 text-[14px] font-medium text-ink">
                {t('profileCopy.m22')}
              </span>
              <ChevronRight className="size-4 text-ink-3" />
            </Link>
          </aside>

          <div className="stagger flex min-w-0 flex-col gap-6">
            <AdminCard />
            <EditCard user={user} />
            <CreditCard />
          </div>
        </div>
      </PageShell>
    )
  }
  return null
}
export function ProfileAdminCardUi(
  props: ReturnType<typeof ProfileModel.useAdminCardContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    return null
  }
  if (props.viewState === 1) {
    const { me, navigate } = props
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] bg-surface p-6 shadow-lift">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[6px] bg-clay text-white">
            <Shield className="size-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-ink">{t('profileCopy.m23')}</h2>
            <p className="text-[13px] text-ink-3">
              {t('profileCopy.m24')}
              {me.role === 'admin' ? t('profileCopy.m25') : t('profileCopy.m26')}
              {t('profileCopy.m27')}
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate(appPaths.admin.href)}>
          {t('profileCopy.m28')}
        </Button>
      </section>
    )
  }
  return null
}
export function ProfileIdentityCardUi(
  props: ReturnType<typeof ProfileModel.useIdentityCardContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    const { user, busy, fileRef, changeAvatar, error, onSignOut } = props
    return (
      <Card className="flex min-w-0 flex-col items-center rounded-xl p-5 text-center">
        <Avatar
          src={user.avatar}
          name={user.name ?? user.email}
          className="size-20 ring-4 ring-surface"
          fallbackClassName="bg-clay-tint font-display text-[42px] font-semibold text-clay"
        />

        <h2 className="mt-5 max-w-full truncate font-display text-subtitle font-semibold text-ink">
          {user.name ?? t('profileCopy.m29')}
        </h2>
        <p className="mt-1 max-w-full break-all text-[13.5px] text-ink-3">{user.email}</p>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          className="mt-6"
          onClick={() => fileRef.current?.click()}
        >
          {busy ? t('profileCopy.m30') : t('profileCopy.m31')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={changeAvatar}
        />
        {error ? (
          <p role="alert" className="mt-3 text-[12.5px] font-medium text-clay-deep">
            {error}
          </p>
        ) : null}

        <div className="mt-7 w-full border-t border-line pt-5">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink-3 transition-colors hover:text-clay-deep"
          >
            <LogOut className="size-4" />
            {t('profileCopy.m32')}
          </button>
        </div>
      </Card>
    )
  }
  return null
}
export function ProfileEditCardUi(
  props: ReturnType<typeof ProfileModel.useEditCardContainer> & {
    parts: typeof Imported4
  },
) {
  if (props.viewState === 0) {
    const { save, form, user, error, notice, busy } = props
    return (
      <Card asChild className="min-w-0 rounded-xl p-5 sm:p-6">
        <form onSubmit={save} noValidate>
          <h2 className="border-b border-line pb-4 font-display text-subtitle font-semibold text-ink">
            {t('profileCopy.m33')}
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[13px] font-semibold text-ink-2">
                {t('profileCopy.m34')}
              </span>
              <input
                type="text"
                maxLength={40}
                {...form.register('name')}
                className={inputClass + ' mt-1.5 block'}
              />
            </label>

            <div>
              <span className="block text-[13px] font-semibold text-ink-2">
                {t('profileCopy.m35')}
              </span>
              <p className="mt-1.5 truncate rounded-[6px] bg-sunken px-4 py-2.5 text-[14px] text-ink-3">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="min-h-5 text-[13.5px]" role="status">
              {error ? <span className="font-medium text-clay-deep">{error}</span> : null}
              {!error && notice ? <span className="text-sage">{notice}</span> : null}
            </p>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? t('profileCopy.m36') : t('profileCopy.m37')}
            </Button>
          </div>
        </form>
      </Card>
    )
  }
  return null
}
export function ProfileCreditCardUi(
  props: ReturnType<typeof ProfileModel.useCreditCardContainer> & {
    parts: typeof Imported5
  },
) {
  const { CreditHistory } = props.parts
  if (props.viewState === 0) {
    const { fetched } = props
    return (
      <Card asChild className="min-w-0 rounded-xl p-5 sm:p-6">
        <section>
          <h2 className="border-b border-line pb-4 font-display text-subtitle font-semibold text-ink">
            {t('profileCopy.m38')}
          </h2>
          <ProfileCreditBalanceUi {...props} />
          <CreditHistory refresh={fetched} />
        </section>
      </Card>
    )
  }
  return null
}
function ProfileCreditBalanceUi({
  q,
  canPay,
  left,
  pct,
}: ReturnType<typeof ProfileModel.useCreditCardContainer>) {
  if (q === 'loading')
    return (
      <LoadingRegion className="mt-6"><FormSkeleton /></LoadingRegion>
    )
  if (q === 'error') return <p className="mt-6 text-[13px] text-ink-3">{t('profileCopy.m12')}</p>
  if (q === 'unlimited')
    return (
      <>
        <p className="mt-7 font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {t('profileCopy.m13')}
          <span className="ml-2 text-[18px] font-medium text-ink-3">{t('profileCopy.m14')}</span>
        </p>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-clay/80" aria-hidden />
      </>
    )
  if (q === null) return <p className="mt-6 text-[13px] text-ink-3">{t('profileCopy.m15')}</p>
  return (
    <>
      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
          {fmt(left)}
          <span className="text-[18px] font-medium text-ink-3">{t('profileCopy.m16')}</span>
        </p>
        {canPay ? (
          <Link
            to={appPaths.pricing.href}
            className="text-[13.5px] font-semibold text-clay hover:underline"
          >
            {t('profileCopy.m17')}
          </Link>
        ) : null}
      </div>
      <ProgressBar pct={pct} label={t('profileCopy.m18')} />
      {q.base ? (
        <p className="mt-3 text-[12.5px] text-ink-3">
          {t('profileCopy.m19')}
          {fmt(Math.floor(q.base / 1000))}
          {t('profileCopy.m20')}
        </p>
      ) : null}
    </>
  )
}
export function ProfileCreditHistoryUi(
  props: ReturnType<typeof ProfileModel.useCreditHistoryContainer> & {
    parts: typeof Imported6
  },
) {
  if (props.viewState === 0) {
    const { rows } = props
    return (
      <div className="mt-7 border-t border-line pt-5">
        <h3 className="text-[14px] font-semibold text-ink">{t('profileCopy.m39')}</h3>
        {rows === null ? (
          <p className="mt-3 text-[13px] text-ink-3">{t('profileCopy.m11')}</p>
        ) : rows === 'error' ? (
          <p className="mt-3 text-[13px] text-ink-3">{t('profileCopy.m40')}</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-3">{t('profileCopy.m41')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[14px] text-ink">
                    {EVENT_LABELS[r.kind] ?? t('profileCopy.m42')}
                  </p>
                  <p className="text-[12px] text-ink-3">
                    {new Date(r.created_at).toLocaleString('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-[14px] font-semibold text-emerald-700 tnum">
                  {t('profileCopy.m43')}
                  {fmt(Math.floor(r.tokens / 1000))}
                  {t('profileCopy.m44')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  return null
}
