'use client'
import { lib_adminApi_AUDIT_LABEL as AUDIT_LABEL } from '@admin-pages-engine'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { History, RefreshCw } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  PageHeader,
  Pager,
} from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { AdminTable } from '@/modules/admin-pages/components/admin-primitives-ui'
import {
  formatAuditDetail,
  formatViDateTime,
  shortenId,
} from '@/modules/admin-pages/hooks/admin-utils'

import type { AuditPanelParts as Imported0 } from '@/modules/admin-pages/containers/audit-panel-container/audit-panel-container'
import type { AuditPanelModel } from '@/modules/admin-pages/hooks'
export function AuditPanelAuditPanelUi(
  props: ReturnType<typeof AuditPanelModel.useAuditPanelContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const { setReloadTick, loading, items, totalPages, page, setPage } = props
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={t('adminOpsCopy.m180')} className="mb-0 [&_h1]:text-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadTick((current) => current + 1)}
              disabled={loading}
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('adminOpsCopy.m95')}</span>
            </Button>
          </div>
        </div>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="max-h-[65vh] overflow-auto overscroll-contain">
            <AdminTable className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
              <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-3">{t('adminOpsCopy.m174')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m84')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m181')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m182')}</th>
                </tr>
              </thead>
              <tbody className="divide-line-2 divide-y">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-ink-3 py-16 text-center">
                      <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                      <span>{t('adminOpsCopy.m183')}</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12">
                      <EmptyState
                        icon={<History className="text-ink-4 size-6" />}
                        title={t('adminOpsCopy.m184')}
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((entry) => {
                    const actionLabel = AUDIT_LABEL[entry.action] ?? entry.action
                    const isBan = entry.action === 'users.ban'
                    const isUnban = entry.action === 'users.unban'
                    const isDelete = entry.action === 'users.delete'
                    const isQuota =
                      entry.action.startsWith('quota.') || entry.action.startsWith('credits.')
                    return (
                      <tr key={entry.id} className="hover:bg-sunken/40 transition-colors">
                        <td className="tnum text-ink-2 px-4 py-3 font-medium whitespace-nowrap">
                          {formatViDateTime(entry.createdAt)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            tone={
                              isBan || isDelete
                                ? 'clay'
                                : isUnban
                                  ? 'sage'
                                  : isQuota
                                    ? 'honey'
                                    : 'neutral'
                            }
                          >
                            {actionLabel}
                          </Badge>
                        </td>

                        <td className="text-ink-3 px-4 py-3 font-mono text-[12.5px] whitespace-nowrap">
                          <span data-tip={entry.target ?? undefined}>
                            {shortenId(entry.target)}
                          </span>
                        </td>

                        <td className="text-ink-2 px-4 py-3 text-[13px]">
                          {formatAuditDetail(entry.action, entry.detail)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </AdminTable>
          </div>

          {totalPages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={totalPages} go={(p) => setPage(p)} />
            </div>
          ) : null}
        </Card>
      </div>
    )
  }
  return null
}
