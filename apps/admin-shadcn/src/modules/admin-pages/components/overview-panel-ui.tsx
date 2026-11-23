'use client'
import { Link } from '@admin-pages-engine'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ArrowRight, BookOpen, Cpu, FileText, Users } from 'lucide-react'

import { Card, PageHeader } from '@/components/product-ui'
import { t as translate } from '@/i18n/translate'
import { formatNumber } from '@/modules/admin-pages/hooks/admin-utils'

import type { OverviewPanelParts as Imported0 } from '@/modules/admin-pages/containers/overview-panel-container/overview-panel-container'
import type { OverviewPanelModel } from '@/modules/admin-pages/hooks'
export function OverviewPanelOverviewPanelUi(
  props: ReturnType<typeof OverviewPanelModel.useOverviewPanelContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const { loading, totalUsers, search, examCount, openReports, bankCount, aiLoading, aiCalls7d } =
      props
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={translate('adminPagesCopy.m1')} className="mb-0 [&_h1]:text-2xl" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[13px] font-medium">
                  {translate('adminPagesCopy.m2')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-9 items-center justify-center rounded-[6px]">
                  <Users className="size-4.5" />
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="flex h-10 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[32px] font-bold tracking-tight">
                    {formatNumber(totalUsers)}
                  </div>
                )}
              </div>
            </div>
            <div className="border-line-2 mt-4 border-t pt-3">
              <Link
                to={`/admin/nguoi-dung${search}`}
                className="text-clay hover:text-clay-deep inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              >
                <span>{translate('adminPagesCopy.m3')}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[13px] font-medium">
                  {translate('adminPagesCopy.m4')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-9 items-center justify-center rounded-[6px]">
                  <FileText className="size-4.5" />
                </div>
              </div>
              <div className="mt-3">
                {examCount === undefined ? (
                  <div className="flex h-10 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[32px] font-bold tracking-tight">
                    {examCount === null ? '—' : formatNumber(examCount)}
                    <span className="text-ink-3 ml-1.5 text-[12.5px] font-normal">
                      {translate('adminPagesCopy.m5')}
                    </span>
                  </div>
                )}
              </div>
              {openReports ? (
                <p className="text-clay mt-1 text-[12.5px] font-medium">
                  {formatNumber(openReports)}
                  {translate('adminPagesCopy.m6')}
                </p>
              ) : null}
            </div>
            <div className="border-line-2 mt-4 border-t pt-3">
              <Link
                to={`/admin/noi-dung${search}`}
                className="text-clay hover:text-clay-deep inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              >
                <span>{translate('adminPagesCopy.m7')}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[13px] font-medium">
                  {translate('adminPagesCopy.m8')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-9 items-center justify-center rounded-[6px]">
                  <BookOpen className="size-4.5" />
                </div>
              </div>
              <div className="mt-3">
                {bankCount === undefined ? (
                  <div className="flex h-10 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[32px] font-bold tracking-tight">
                    {bankCount === null ? '—' : formatNumber(bankCount)}
                    <span className="text-ink-3 ml-1.5 text-[12.5px] font-normal">
                      {translate('adminPagesCopy.m9')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="border-line-2 mt-4 border-t pt-3">
              <Link
                to={`/admin/ngan-hang${search}`}
                className="text-clay hover:text-clay-deep inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              >
                <span>{translate('adminPagesCopy.m10')}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>

          <Card className="border-line flex flex-col justify-between border p-5 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-3 text-[13px] font-medium">
                  {translate('adminPagesCopy.m11')}
                </span>
                <div className="bg-sunken text-ink-2 flex size-9 items-center justify-center rounded-[6px]">
                  <Cpu className="size-4.5" />
                </div>
              </div>
              <div className="mt-3">
                {aiLoading ? (
                  <div className="flex h-10 items-center">
                    <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                  </div>
                ) : (
                  <div className="tnum text-ink text-[32px] font-bold tracking-tight">
                    {formatNumber(aiCalls7d)}
                    <span className="text-ink-3 ml-1.5 text-[12.5px] font-normal">
                      {translate('adminPagesCopy.m12')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="border-line-2 mt-4 border-t pt-3">
              <Link
                to={`/admin/ai${search}`}
                className="text-clay hover:text-clay-deep inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              >
                <span>{translate('adminPagesCopy.m13')}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }
  return null
}
