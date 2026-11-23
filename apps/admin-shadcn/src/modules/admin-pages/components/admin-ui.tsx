'use client'
import { ChevronRight, Shield } from 'lucide-react'
import Link from 'next/link'

import { SiteBadge as Badge } from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t as translate } from '@/i18n/translate'
import {
  BankPanelContainer,
  ContentPanelContainer,
  OverviewPanelContainer,
  UsersPanelContainer,
} from '@/modules/admin-pages/containers'

import type { useAdminContainer } from '@/modules/admin-pages/hooks/use-admin-container'
export function AdminUi({ me, section }: ReturnType<typeof useAdminContainer>) {
  if (!me) return null
  const label = {
    overview: translate('adminPagesCopy.overview'),
    users: translate('adminPagesCopy.users'),
    content: translate('adminPagesCopy.content'),
    bank: translate('adminPagesCopy.bank'),
  }[section]
  return (
    <div className="w-full max-w-full overflow-x-clip">
      <div className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
        <header className="border-line bg-canvas/95 sticky top-[52px] z-30 mb-6 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b py-3 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-clay shadow-soft hidden size-9 shrink-0 items-center justify-center rounded-lg font-bold text-white sm:flex">
              <Shield className="size-5" />
            </div>
            <nav
              aria-label={translate('adminPagesCopy.title')}
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              <Link
                href={appPaths.admin.href}
                className="text-caption text-ink-3 hover:text-ink sm:text-body font-medium"
              >
                {translate('adminPagesCopy.title')}
              </Link>
              <ChevronRight className="text-ink-4 size-3" />
              <span className="text-caption text-ink sm:text-body font-semibold">{label}</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-caption text-ink-3 hidden sm:inline">
              {translate('adminPagesCopy.access')}
            </span>
            <Badge tone={me.role === 'admin' ? 'clay' : 'neutral'}>
              {me.role === 'admin' ? 'admin' : translate('adminPagesCopy.moderator')}
            </Badge>
          </div>
        </header>
        <section className="min-w-0 [&_[data-slot=card]]:rounded-xl [&_[data-slot=card]]:shadow-sm">
          <div key={section} className="page-enter">
            {section === 'overview' ? (
              <OverviewPanelContainer />
            ) : section === 'users' ? (
              <UsersPanelContainer me={me} />
            ) : section === 'content' ? (
              <ContentPanelContainer me={me} />
            ) : (
              <BankPanelContainer me={me} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
