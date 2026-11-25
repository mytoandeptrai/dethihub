'use client'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Radio,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { LoadingRegion, TableSkeleton } from '@/components/page-skeleton'
import {
  Avatar,
  SiteButton as Button,
  Card,
  EmptyState,
  PageHeader,
  Segmented,
} from '@/components/product-ui'
import { t } from '@/i18n/translate-admin-ops'
import { AdminModal } from '@/modules/admin-pages/components/admin-primitives-ui'
import { StatsPanelModel } from '@/modules/admin-pages/hooks'
import { formatNumber, shortenId } from '@/modules/admin-pages/hooks/admin-utils'

import type { StatsPanelParts as Imported0 } from '@/modules/admin-pages/containers/stats-panel-container/stats-panel-container'
const { formatRelativeTime } = StatsPanelModel
export function StatsPanelStatsPanelUi(
  props: ReturnType<typeof StatsPanelModel.useStatsPanelContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const {
      days,
      setDays,
      loadOverview,
      loadOnline,
      loading,
      refreshing,
      stats,
      newUsersInPeriod,
      handleOpenOnlineModal,
      currentOnlineCount,
      chartDays,
      maxDailyNewUsers,
      totalItemsInPeriod,
      maxDailyItems,
      showOnlineModal,
      setShowOnlineModal,
      loadingOnline,
      onlineUsers,
    } = props
    return (
      <div className="w-full max-w-full space-y-6 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={t('adminOpsCopy.m4')} className="mb-0 [&_h1]:text-2xl" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Segmented<'7' | '30' | '90'>
              value={days}
              onChange={setDays}
              label={t('adminOpsCopy.m5')}
              options={[
                { key: '7', label: t('adminOpsCopy.m6') },
                { key: '30', label: t('adminOpsCopy.m7') },
                { key: '90', label: t('adminOpsCopy.m8') },
              ]}
            />

            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                void loadOverview(days, true)
                void loadOnline()
              }}
              disabled={loading || refreshing}
              data-tip={t('adminOpsCopy.m9')}
              aria-label={t('adminOpsCopy.m9')}
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:*:col-span-2 sm:max-lg:[&>*:nth-child(3)]:col-span-2 lg:[&>*:nth-child(n+4)]:col-span-3">
          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[12.5px] font-medium">
                  {t('adminOpsCopy.m10')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-8 items-center justify-center rounded-[6px]">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loading ? (
                  <div className="flex h-9 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[26px] font-bold tracking-tight sm:text-[28px]">
                    {formatNumber(stats?.totalUsers)}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[12.5px] font-medium">
                  {t('adminOpsCopy.m11')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-8 items-center justify-center rounded-[6px]">
                  <UserPlus className="size-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loading ? (
                  <div className="flex h-9 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[26px] font-bold tracking-tight sm:text-[28px]">
                    {formatNumber(newUsersInPeriod)}
                  </div>
                )}
              </div>
            </div>
            <p className="border-line-2 text-ink-4 mt-3 border-t pt-2.5 text-[11.5px]">
              {t('adminOpsCopy.m12')}
              {days}
              {t('adminOpsCopy.m13')}
            </p>
          </Card>

          <button
            type="button"
            onClick={handleOpenOnlineModal}
            className="group block w-full rounded-[6px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
          >
            <Card className="border-line shadow-soft flex h-full flex-col justify-between border p-5 transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-50/20 group-active:scale-[0.99]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-ink text-[12.5px] font-semibold">
                      {t('adminOpsCopy.m14')}
                    </span>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-[6px] bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                    <Radio className="size-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="tnum text-ink text-[26px] font-bold tracking-tight sm:text-[28px]">
                    {formatNumber(currentOnlineCount)}
                  </div>
                </div>
              </div>
              <div className="border-line-2 text-ink-4 mt-3 flex items-center justify-between border-t pt-2.5 text-[11.5px]">
                <span className="truncate">{t('adminOpsCopy.m15')}</span>
                <ArrowUpRight className="text-ink-4 group-hover:text-ink size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Card>
          </button>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[12.5px] font-medium">
                  {t('adminOpsCopy.m16')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-8 items-center justify-center rounded-[6px]">
                  <Activity className="size-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loading ? (
                  <div className="flex h-9 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[26px] font-bold tracking-tight sm:text-[28px]">
                    {formatNumber(stats?.active7d)}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[12.5px] font-medium">
                  {t('adminOpsCopy.m17')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-8 items-center justify-center rounded-[6px]">
                  <Calendar className="size-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loading ? (
                  <div className="flex h-9 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[26px] font-bold tracking-tight sm:text-[28px]">
                    {formatNumber(stats?.active30d)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="border-line bg-surface rounded-[6px] border p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-ink text-[14px] font-semibold">{t('adminOpsCopy.m18')}</h3>
            </div>
            <div className="text-ink-3 text-[12px]">
              {t('adminOpsCopy.m19')}{' '}
              <span className="text-ink font-semibold">{formatNumber(newUsersInPeriod)}</span>
              {t('adminOpsCopy.m20')}
            </div>
          </div>

          {loading || refreshing ? (
            <LoadingRegion>
              <Skeleton className="h-44 w-full" />
            </LoadingRegion>
          ) : chartDays.length === 0 ? (
            <EmptyState title={t('adminOpsCopy.m22')} className="min-h-44" />
          ) : (
            <div className="w-full touch-pan-x overflow-x-auto pb-2">
              <div className="border-line flex h-48 min-w-[320px] items-end gap-1 border-b px-1 pt-6 sm:gap-2">
                {chartDays.map((d, idx) => {
                  const heightPercent =
                    d.newUsers > 0
                      ? Math.max(6, Math.round((d.newUsers / maxDailyNewUsers) * 100))
                      : 2
                  const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`
                  const showLabel =
                    days === '7' ||
                    (days === '30' && (idx % 3 === 0 || idx === chartDays.length - 1)) ||
                    (days === '90' && (idx % 7 === 0 || idx === chartDays.length - 1))
                  return (
                    <div
                      key={d.day}
                      className="group relative flex h-full min-w-[8px] flex-1 flex-col items-center justify-end"
                      data-tip={t('adminOpsCopy.m23', {
                        value0: d.day,
                        value1: formatNumber(d.newUsers),
                      })}
                    >
                      <div
                        className={cn(
                          'w-full max-w-[28px] rounded-t-[3px] transition-all group-hover:brightness-90',
                          d.newUsers > 0 ? 'bg-sage/80' : 'bg-sunken/60',
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span
                        className={cn(
                          'mt-2 text-[10px] font-medium whitespace-nowrap transition-colors select-none sm:text-[11px]',
                          showLabel ? 'text-ink-4 group-hover:text-ink' : 'opacity-0',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-line bg-surface rounded-[6px] border p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-ink text-[14px] font-semibold">{t('adminOpsCopy.m24')}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="bg-sage size-2.5 rounded-[2px]" />
                <span className="text-ink-3">{t('adminOpsCopy.m25')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-clay size-2.5 rounded-[2px]" />
                <span className="text-ink-3">{t('adminOpsCopy.m26')}</span>
              </div>
              <div className="text-ink-4">
                {t('adminOpsCopy.m19')}{' '}
                <span className="text-ink font-semibold">{formatNumber(totalItemsInPeriod)}</span>
              </div>
            </div>
          </div>

          {loading || refreshing ? (
            <LoadingRegion>
              <Skeleton className="h-44 w-full" />
            </LoadingRegion>
          ) : chartDays.length === 0 ? (
            <EmptyState title={t('adminOpsCopy.m27')} className="min-h-44" />
          ) : (
            <div className="w-full touch-pan-x overflow-x-auto pb-2">
              <div className="border-line flex h-48 min-w-[320px] items-end gap-1 border-b px-1 pt-6 sm:gap-2">
                {chartDays.map((d, idx) => {
                  const total = (d.newDocs || 0) + (d.newDecks || 0)
                  const heightPercent =
                    total > 0 ? Math.max(6, Math.round((total / maxDailyItems) * 100)) : 2
                  const deckPercent = total > 0 ? ((d.newDecks || 0) / total) * 100 : 0
                  const docPercent = 100 - deckPercent
                  const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`
                  const showLabel =
                    days === '7' ||
                    (days === '30' && (idx % 3 === 0 || idx === chartDays.length - 1)) ||
                    (days === '90' && (idx % 7 === 0 || idx === chartDays.length - 1))
                  return (
                    <div
                      key={d.day}
                      className="group relative flex h-full min-w-[8px] flex-1 flex-col items-center justify-end"
                      data-tip={t('adminOpsCopy.m29', {
                        value0: d.day,
                        value1: formatNumber(d.newDocs),
                        value2: formatNumber(d.newDecks),
                        value3:
                          d.newCommunityExams > 0
                            ? t('adminOpsCopy.m28', { value0: formatNumber(d.newCommunityExams) })
                            : '',
                      })}
                    >
                      <div
                        className={cn(
                          'flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-[3px] transition-all group-hover:brightness-95',
                          total > 0 ? 'bg-sunken/40' : 'bg-sunken/60',
                        )}
                        style={{ height: `${heightPercent}%` }}
                      >
                        {d.newDecks > 0 ? (
                          <div
                            className="bg-clay w-full transition-all"
                            style={{ height: `${deckPercent}%` }}
                          />
                        ) : null}
                        {d.newDocs > 0 ? (
                          <div
                            className="bg-sage w-full transition-all"
                            style={{ height: `${docPercent}%` }}
                          />
                        ) : null}
                      </div>

                      <span
                        className={cn(
                          'mt-2 text-[10px] font-medium whitespace-nowrap transition-colors select-none sm:text-[11px]',
                          showLabel ? 'text-ink-4 group-hover:text-ink' : 'opacity-0',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <p className="text-ink-4 mt-3 text-[12px]">{t('adminOpsCopy.m30')}</p>
        </div>

        {showOnlineModal ? (
          <AdminModal
            title={t('adminOpsCopy.m31', { value0: formatNumber(currentOnlineCount) })}
            onClose={() => setShowOnlineModal(false)}
            className="max-w-md p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <h3 id="online-users-modal-title" className="text-ink text-[17px] font-bold">
                    {t('adminOpsCopy.m32')}
                    {formatNumber(currentOnlineCount)}
                    {t('adminOpsCopy.m33')}
                  </h3>
                </div>
                <p className="text-ink-3 mt-1 text-[12px]">{t('adminOpsCopy.m34')}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowOnlineModal(false)}
                className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5 transition-colors"
                aria-label={t('adminOpsCopy.m35')}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="divide-line-2 mt-4 max-h-[55vh] divide-y overflow-y-auto">
              {loadingOnline ? (
                <LoadingRegion>
                  <TableSkeleton />
                </LoadingRegion>
              ) : onlineUsers.length === 0 ? (
                <EmptyState title={t('adminOpsCopy.m37')} />
              ) : (
                onlineUsers.map((u, i) => (
                  <div
                    key={u.userId || i}
                    className="flex items-center justify-between gap-2 py-2.5 text-[13px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        src={u.avatar}
                        name={u.name || u.email}
                        className="size-7 text-[11px]"
                      />
                      <span className="text-ink truncate font-medium">
                        {u.name || shortenId(u.userId)}
                      </span>
                    </div>
                    <span className="text-ink-4 shrink-0 text-[11.5px]">
                      {formatRelativeTime(u.lastSeen)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-line-2 mt-5 flex items-center justify-between border-t pt-4">
              <span className="text-ink-4 text-[11.5px]">{t('adminOpsCopy.m38')}</span>
              <Button variant="soft" size="sm" onClick={() => setShowOnlineModal(false)}>
                {t('adminOpsCopy.m35')}
              </Button>
            </div>
          </AdminModal>
        ) : null}
      </div>
    )
  }
  return null
}
