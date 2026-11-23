'use client'

import { Button } from '@workspace/ui/components/button'
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import { Sheet, SheetContent, SheetTitle } from '@workspace/ui/components/sheet'
import { cn } from '@workspace/ui/lib/utils'
import { Command } from 'cmdk'
import {
  Coins,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

import type { useAppShellContainer } from '@/modules/shell/hooks'
import type { ReactNode } from 'react'

type AppShellUiProps = ReturnType<typeof useAppShellContainer> & { children: ReactNode }
type SidebarUiProps = Omit<AppShellUiProps, 'children'> & { compact: boolean }
function SidebarUi({
  compact,
  pathname,
  session,
  workspace,
  explore,
  admin,
  points,
  quotaFraction,
  onNavigate,
  onCollapse,
  onFeedbackChange,
  onSignOut,
}: SidebarUiProps) {
  const linkClass = cn(
    'relative flex min-h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100',
    compact && 'justify-center px-0',
  )
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        className={cn('flex h-[60px] shrink-0 items-center px-5', compact && 'justify-center px-2')}
      >
        <Link href={appPaths.home.href} aria-label={t('common.brand')}>
          <Image
            unoptimized
            width={260}
            height={72}
            src={compact ? '/brand/favicon.svg' : '/brand/logo-de-ro.svg'}
            alt={t('common.brand')}
            className={compact ? 'size-8' : 'h-10 w-auto'}
          />
        </Link>
      </div>
      <div className="px-2 pb-3">
        {session ? (
          <button
            type="button"
            className={cn(linkClass, 'w-full border border-slate-200 py-2 text-left')}
            onClick={() => onNavigate(appPaths.profile.href)}
            aria-label={t('product.account')}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs text-indigo-700">
              {session.user.email?.slice(0, 1).toUpperCase()}
            </span>
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">
                  {session.user.user_metadata.display_name ?? session.user.email}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <svg viewBox="0 0 20 20" className="size-3.5 -rotate-90" aria-hidden="true">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeDasharray={`${50.27 * quotaFraction} 50.27`}
                    />
                  </svg>
                  {points}
                </span>
              </span>
            )}
          </button>
        ) : (
          <Link
            href={appPaths.auth.login.href}
            className={cn(linkClass, 'border border-slate-200')}
            aria-label={t('auth.loginTitle')}
          >
            <LogIn className="size-4" />
            {!compact && t('auth.loginTitle')}
          </Link>
        )}
        <Link
          href={appPaths.editor.href}
          className={cn(
            linkClass,
            'mt-3 justify-center bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
          )}
          aria-label={t('product.create')}
        >
          <span className="text-lg">+</span>
          {!compact && t('product.create')}
        </Link>
      </div>
      <nav
        aria-label={t('product.navigation')}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-3"
      >
        {[
          { label: t('product.workspace'), items: workspace },
          { label: t('product.explore'), items: explore },
          ...(admin.length > 0 ? [{ label: t('common.admin'), items: admin }] : []),
        ].map((group) => (
          <section key={group.label} className="space-y-1" aria-label={group.label}>
            {!compact && (
              <h2 className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.label}
              </h2>
            )}
            {group.items.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onNavigate(item.path)}
                aria-label={item.label}
                aria-current={pathname === item.path ? 'page' : undefined}
                className={cn(
                  linkClass,
                  pathname === item.path &&
                    'bg-indigo-50 text-indigo-700 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-indigo-600 hover:bg-indigo-50',
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!compact && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </section>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-2">
        <Link href={appPaths.pricing.href} className={linkClass} aria-label={t('product.price')}>
          <Coins className="size-4" />
          {!compact && t('product.price')}
        </Link>
        <button
          type="button"
          onClick={() => onFeedbackChange(true)}
          className={cn(linkClass, 'w-full')}
          aria-label={t('product.feedback')}
        >
          <MessageSquare className="size-4" />
          {!compact && t('product.feedback')}
        </button>
        {session && (
          <button
            type="button"
            onClick={() => void onSignOut()}
            className={cn(linkClass, 'w-full')}
            aria-label={t('common.signOut')}
          >
            <LogOut className="size-4" />
            {!compact && t('common.signOut')}
          </button>
        )}
        <button
          type="button"
          onClick={onCollapse}
          aria-expanded={!compact}
          aria-label={t(compact ? 'product.expand' : 'product.compact')}
          className={cn(linkClass, 'hidden w-full lg:flex')}
        >
          {compact ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!compact && (
            <>
              <span className="flex-1 text-left">{t('product.collapse')}</span>
              <kbd className="text-[10px] text-slate-400">Ctrl B</kbd>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function AppShellUi(props: AppShellUiProps) {
  const {
    children,
    collapsed,
    mobileOpen,
    paletteOpen,
    palette,
    pathname,
    mobileNavigation,
    onMobileChange,
    onPaletteChange,
    onNavigate,
  } = props
  return (
    <div className="min-h-dvh bg-slate-50/60 text-slate-800">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 lg:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarUi {...props} compact={collapsed} />
      </aside>
      <div
        className={cn(
          'flex min-h-dvh min-w-0 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0',
          collapsed ? 'lg:pl-16' : 'lg:pl-60',
        )}
      >
        <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 lg:hidden"
              aria-label={t('product.openNavigation')}
              onClick={() => onMobileChange(true)}
            >
              <Menu />
            </Button>
            <nav
              aria-label={t('product.position')}
              className="flex min-w-0 items-center gap-2 text-xs text-slate-500"
            >
              <Link
                href={appPaths.myDocs.href}
                className="hidden shrink-0 hover:text-indigo-600 sm:inline"
              >
                {t('product.workspace')}
              </Link>
              <span aria-hidden="true" className="hidden sm:block">
                ›
              </span>
              <span className="truncate font-medium text-slate-800">
                {palette.find((item) => item.path === pathname)?.label ?? t('common.brand')}
              </span>
            </nav>
          </div>
          <Button
            variant="ghost"
            className="ml-auto h-8 gap-2 rounded-md border border-slate-200 px-2 text-xs text-slate-500 sm:min-w-44"
            onClick={() => onPaletteChange(true)}
            aria-label={t('product.commandAria')}
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">{t('product.command')}</span>
            <kbd className="ml-auto hidden rounded border px-1 text-[10px] sm:inline">Ctrl K</kbd>
          </Button>
        </header>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      <Sheet open={mobileOpen} onOpenChange={onMobileChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(320px,calc(100vw-2rem))] gap-0 p-0"
        >
          <SheetTitle className="sr-only">{t('product.navigation')}</SheetTitle>
          <SidebarUi {...props} compact={false} />
        </SheetContent>
      </Sheet>
      <nav
        aria-label={t('product.mobileNavigation')}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {mobileNavigation.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] text-slate-500',
              pathname === item.path && 'text-indigo-600',
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          aria-label={t('product.openNavigation')}
          onClick={() => onMobileChange(true)}
          className="flex flex-col items-center justify-center gap-1 text-[10px] text-slate-500"
        >
          <Menu className="size-5" />
          {t('product.menu')}
        </button>
      </nav>
      <Dialog open={paletteOpen} onOpenChange={onPaletteChange}>
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden p-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t('product.command')}</DialogTitle>
          <Command label={t('product.selectPage')} loop>
            <Command.Input
              autoFocus
              placeholder={t('product.searchPlaceholder')}
              className="w-full border-b border-slate-200 p-4 text-sm outline-none"
            />
            <Command.List className="max-h-[min(60dvh,420px)] overflow-y-auto p-2">
              <Command.Empty className="p-6 text-center text-sm">
                {t('product.noResults')}
              </Command.Empty>
              {palette.map((item) => (
                <Command.Item
                  key={`${item.label} ${item.path}`}
                  value={`${item.label} ${item.path}`}
                  keywords={[item.path]}
                  onSelect={() => onNavigate(item.path)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  )
}
