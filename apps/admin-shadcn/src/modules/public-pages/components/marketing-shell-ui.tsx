'use client'
import { cn } from '@workspace/ui/lib/utils'
import { Coins, LogOut, Menu, X } from 'lucide-react'
import Image from 'next/image'

import { PublicLinks } from '@/components/seo/public-links'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-public'
import {
  AvatarUi,
  Button,
  Link,
  NavLink,
} from '@/modules/public-pages/components/public-primitives-ui'

import type { useMarketingContainer } from '@/modules/public-pages/hooks'
const NAV = [
  { to: appPaths.home.href, label: t('publicCopy.m318'), end: true },
  { to: appPaths.editor.href, label: t('publicCopy.m319') },
  { to: appPaths.onlineExams.href, label: t('publicCopy.m320'), beta: true },
  { to: appPaths.community.href, label: t('publicCopy.m321') },
  { to: appPaths.library.href, label: t('publicCopy.m322') },
]
function BetaTagUi() {
  return (
    <span className="bg-clay-soft text-clay ml-1.5 rounded-full px-1.5 py-px align-[2px] text-[10px] font-bold tracking-wide uppercase">
      {t('publicCopy.m323')}
    </span>
  )
}
function LogoUi({ className }: { className?: string }) {
  return (
    <Image
      unoptimized
      src="/brand/logo-de-ro.svg"
      alt={t('publicCopy.m151')}
      width={260}
      height={72}
      className={className}
    />
  )
}
export function HeaderUi(props: ReturnType<typeof useMarketingContainer>) {
  const { scrolled, menuOpen, menuAnim, session, canPay, onMenuToggle, onSignOut, pathname } = props
  const nav = NAV
  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[colors,box-shadow] duration-150',
        scrolled
          ? 'border-line border-b bg-white/80 backdrop-blur-xl'
          : 'bg-canvas border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-3 px-5 sm:px-6">
        <Link
          to={appPaths.home.href}
          className="group flex shrink-0 items-center"
          aria-label={t('publicCopy.m324')}
        >
          <LogoUi className="h-9 w-auto transition-transform duration-500 group-hover:scale-105" />
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <NavLink
              pathname={pathname}
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:shadow-ring focus-visible:outline-none',
                  isActive ? 'bg-clay-tint text-clay' : 'text-ink-3 hover:bg-sunken hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {'beta' in item && item.beta ? <BetaTagUi /> : null}
                  {isActive ? <span className="hidden" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {canPay ? (
            <Link
              to={appPaths.pricing.href}
              className="hidden lg:block"
              aria-label={t('publicCopy.m325')}
            >
              <Button
                variant="primary"
                size="sm"
                className="whitespace-nowrap max-xl:px-2.5"
                data-tip={t('publicCopy.m325')}
              >
                <Coins className="size-4" />
                <span className="max-xl:hidden">{t('publicCopy.m325')}</span>
              </Button>
            </Link>
          ) : null}

          {session ? (
            <div className="hidden items-center gap-1 md:flex">
              <Link
                to={appPaths.profile.href}
                className="text-ink ring-line hover:text-clay hover:ring-clay-line flex max-w-[150px] items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-1.5 text-[13px] font-semibold ring-1 transition-[colors,box-shadow] duration-150 focus-visible:shadow-ring focus-visible:outline-none xl:max-w-[220px]"
              >
                <AvatarUi
                  src={session.user.avatar}
                  name={session.user.name ?? session.user.email}
                  className="size-7 text-[10.5px]"
                  fallbackClassName="bg-clay font-bold text-white"
                />
                <span className="truncate">{session.user.name ?? session.user.email}</span>
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                aria-label={t('publicCopy.m326')}
                data-tip={t('publicCopy.m326')}
                className="text-ink-3 hover:text-ink flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors max-xl:px-2"
              >
                <LogOut className="size-3.5" />
                <span className="max-xl:hidden">{t('publicCopy.m326')}</span>
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link
                to={appPaths.auth.login.href}
                className="text-ink-3 hover:text-ink rounded-full px-3.5 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors"
              >
                {t('publicCopy.m327')}
              </Link>
              <Link to={appPaths.auth.register.href}>
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  {t('publicCopy.m328')}
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={onMenuToggle}
            className="border-line text-ink shadow-soft hover:bg-sunken flex size-10 items-center justify-center rounded-lg border bg-white focus-visible:shadow-ring focus-visible:outline-none lg:hidden"
            aria-label={t('publicCopy.m329')}
          >
            {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {menuAnim.mounted ? (
        <div
          className={cn(
            'border-line shadow-float max-h-[calc(100dvh-68px)] overflow-y-auto rounded-b-2xl border-y bg-white lg:hidden',
            menuAnim.closing ? 'slide-out-up' : 'anim-slide',
          )}
        >
          <div className="mx-auto max-w-[1180px] space-y-1 px-5 py-4 sm:px-6">
            {nav.map((item) => (
              <NavLink
                pathname={pathname}
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition-colors focus-visible:shadow-ring focus-visible:outline-none',
                    isActive
                      ? 'bg-clay-tint text-clay'
                      : 'text-ink-2 hover:bg-sunken hover:text-ink',
                  )
                }
              >
                {item.label}
                {'beta' in item && item.beta ? <BetaTagUi /> : null}
              </NavLink>
            ))}
            {canPay ? (
              <Link to={appPaths.pricing.href} className="mt-2 block">
                <Button variant="primary" className="w-full">
                  {t('publicCopy.m325')}
                </Button>
              </Link>
            ) : null}
            <div className="border-line/70 mt-2 border-t pt-2 md:hidden">
              {session ? (
                <>
                  <Link
                    to={appPaths.profile.href}
                    className="text-ink-2 hover:bg-sunken block rounded-xl px-3 py-2.5 text-[14.5px] font-semibold"
                  >
                    {t('publicCopy.m330')}
                  </Link>
                  <p className="text-ink-3 truncate px-3 py-2 text-[13.5px]">
                    {session.user.name
                      ? `${session.user.name} · ${session.user.email}`
                      : session.user.email}
                  </p>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="text-ink-2 hover:bg-sunken block w-full rounded-xl px-3 py-2.5 text-left text-[14.5px] font-semibold"
                  >
                    {t('publicCopy.m326')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={appPaths.auth.login.href}
                    className="text-ink-2 hover:bg-sunken block rounded-xl px-3 py-2.5 text-[14.5px] font-semibold"
                  >
                    {t('publicCopy.m327')}
                  </Link>
                  <Link
                    to={appPaths.auth.register.href}
                    className="text-ink-2 hover:bg-sunken block rounded-xl px-3 py-2.5 text-[14.5px] font-semibold"
                  >
                    {t('publicCopy.m328')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
export function FooterUi() {
  return (
    <footer className="border-line mt-24 overflow-hidden border-t bg-white">
      <PublicLinks />
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 sm:px-6 md:gap-10 md:py-16 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoUi className="h-7 w-auto" />
          </div>
          <p className="text-ink-3 mt-3.5 max-w-[32ch] text-[13px] leading-relaxed">
            {t('publicCopy.m331')}
          </p>
        </div>

        <FooterColUi
          title={t('publicCopy.m332')}
          items={[
            { label: t('publicCopy.m319'), to: appPaths.editor.href },
            { label: t('publicCopy.m321'), to: appPaths.community.href },
            { label: t('publicCopy.m333'), to: appPaths.myDocs.href },
            { label: t('publicCopy.m322'), to: appPaths.library.href },
          ]}
        />
        <FooterColUi
          title={t('publicCopy.m334')}
          items={[
            { label: t('publicCopy.m335'), to: appPaths.grading.href },
            { label: t('publicCopy.m336'), to: appPaths.community.href },
            { label: t('publicCopy.m337'), to: appPaths.editor.href },
            { label: t('publicCopy.m338'), to: appPaths.editor.href },
          ]}
        />
      </div>

      <div className="border-line border-t">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-ink-3 text-[12px]">{t('publicCopy.m341')}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={appPaths.privacy.href}
              className="text-ink-3 hover:text-ink text-[12px] font-medium hover:underline"
            >
              {t('publicCopy.m343')}
            </Link>
            <Link
              to={appPaths.terms.href}
              className="text-ink-3 hover:text-ink text-[12px] font-medium hover:underline"
            >
              {t('publicCopy.m344')}
            </Link>
            <p className="text-ink-3 hidden text-[12px] font-semibold sm:block">
              {t('publicCopy.m345')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
function FooterColUi({
  title,
  items,
}: {
  title: string
  items: {
    label: string
    to: string
  }[]
}) {
  return (
    <div>
      <p className="eyebrow mb-3.5">{title}</p>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to}
              className="reveal text-ink-3 hover:text-clay decoration-clay-line text-[13px] font-medium underline-offset-4 transition-colors hover:underline"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
