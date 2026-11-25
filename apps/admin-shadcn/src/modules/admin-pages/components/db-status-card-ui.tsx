'use client'
import { LoadingRegion } from '@/components/page-skeleton'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Database, RotateCw } from 'lucide-react'

import { t } from '@/i18n/translate'
import { DbStatusCardModel } from '@/modules/admin-pages/hooks'

import type {
  DbStatusCardParts as Imported0,
  DbStatusCardParts as Imported1,
} from '@/modules/admin-pages/containers/db-status-card-container/db-status-card-container'
const { REGION_LABEL, tone, fmtPct } = DbStatusCardModel
export function DbStatusCardSgFlagUi(
  props: ReturnType<typeof DbStatusCardModel.useSgFlagContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    return (
      <svg
        viewBox="0 0 30 20"
        className="h-5 w-[30px] shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
        aria-label={t('adminOpsCopy.m199')}
      >
        <rect width="30" height="10" fill="#ED2939" />
        <rect y="10" width="30" height="10" fill="#fff" />
        <circle cx="7" cy="5" r="3.4" fill="#fff" />
        <circle cx="8.3" cy="5" r="3.2" fill="#ED2939" />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (-90 + i * 72) * (Math.PI / 180)
          return (
            <circle
              key={i}
              cx={11 + 1.9 * Math.cos(a)}
              cy={5 + 1.9 * Math.sin(a)}
              r="0.55"
              fill="#fff"
            />
          )
        })}
      </svg>
    )
  }
  return null
}
export function DbStatusCardDbStatusCardUi(
  props: ReturnType<typeof DbStatusCardModel.useDbStatusCardContainer> & {
    parts: typeof Imported1
  },
) {
  const { SgFlag } = props.parts
  if (props.viewState === 0) {
    const { st, load, loading, err, connPct, conns } = props
    return (
      <div className="border-line bg-surface mb-5 max-w-[420px] rounded-[10px] border shadow-xs">
        <div className="flex items-start gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#3ecf8e] text-[#0b3d26]">
            <Database className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-ink text-[14.5px] font-semibold">
              {st?.name ?? 'Primary Database'}
            </div>
            <div className="text-ink-2 truncate text-[13px]">
              {st ? (REGION_LABEL[st.region] ?? st.region) : '…'}
            </div>
            <div className="text-ink-3 text-[12.5px]">
              {st ? `${st.region} · ${st.compute}` : ' '}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {st?.region === 'ap-southeast-1' ? <SgFlag /> : null}
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading}
              aria-label={t('adminOpsCopy.m200')}
              className="text-ink-3 hover:bg-sunken hover:text-ink rounded p-1 transition-colors disabled:opacity-40"
            >
              <RotateCw className={cn('size-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
        <div className="border-line text-ink-3 tnum flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-4 py-2.5 text-[12.5px]">
          {loading && !st ? <LoadingRegion><div className="flex gap-3">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-5 w-14" />)}</div></LoadingRegion> : err ? (
            <span className="text-clay">{err}</span>
          ) : (
            <>
              <span>
                {t('adminOpsCopy.m201')}
                <b className={cn('font-semibold', tone(st?.cpu ?? null))}>
                  {loading && !st ? '…' : fmtPct(st?.cpu ?? null)}
                </b>
              </span>
              <span aria-hidden>{t('adminOpsCopy.m202')}</span>
              <span>
                {t('adminOpsCopy.m203')}
                <b className={cn('font-semibold', tone(st?.disk ?? null))}>
                  {loading && !st ? '…' : fmtPct(st?.disk ?? null)}
                </b>
              </span>
              <span aria-hidden>{t('adminOpsCopy.m202')}</span>
              <span>
                {t('adminOpsCopy.m204')}
                <b className={cn('font-semibold', tone(st?.ram ?? null))}>
                  {loading && !st ? '…' : fmtPct(st?.ram ?? null)}
                </b>
              </span>
              <span aria-hidden>{t('adminOpsCopy.m202')}</span>
              <span>
                <b className={cn('font-semibold', tone(connPct))}>{loading && !st ? '…' : conns}</b>
                {t('adminOpsCopy.m205')}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }
  return null
}
