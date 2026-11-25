'use client'
import dynamic from 'next/dynamic'

import { LoadingRegion, CardGridSkeleton } from '@/components/page-skeleton'
import { t } from '@/i18n/translate-public'
import { PageHeader, PageShell } from '@/modules/public-pages/components/page-header-ui'
import { Card } from '@/modules/public-pages/components/public-primitives-ui'

import type { useDesignsContainer } from '@/modules/public-pages/hooks'
const SlideThumb = dynamic(() => import('@engine-designs').then((m) => m.SlideThumb), {
  ssr: false,
})
export default function PreviewDesignsUi({
  ready,
  rows,
  count,
  error,
}: ReturnType<typeof useDesignsContainer>) {
  return (
    <PageShell>
      <div id="comparison-matrix" className="text-ink min-w-0">
        <PageHeader
          title={
            <>
              {t('publicCopy.m284')}
              {count}
              {t('publicCopy.m285')}
            </>
          }
          description=""
        />
        {!ready && (
          <LoadingRegion>
            <CardGridSkeleton />
          </LoadingRegion>
        )}
        {error && <p role="alert">{t('common.networkError')}</p>}

        <div className="flex flex-col gap-6">
          {rows.map(({ design, skin, theme, slide1, slide3, slideClosing }, idx) => (
            <Card key={design.id} className="flex min-w-0 flex-col gap-3 rounded-xl p-4 sm:p-5">
              <div className="border-line flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="bg-ink text-paper flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-ink text-base font-bold">{design.name}</span>
                  <code className="bg-clay/20 text-ink-2 rounded px-1.5 py-0.5 text-xs">
                    {design.id}
                  </code>
                </div>
                <div className="text-ink-3 text-xs">
                  {t('publicCopy.m286')}
                  <span className="text-ink-2 font-semibold">{skin?.fonts.heading}</span>
                  {t('publicCopy.m287')}
                  {design.slides.map((s) => s.layout).join(' → ')}
                </div>
              </div>

              <p className="text-ink-3 text-xs italic">
                <strong>{t('publicCopy.m288')}</strong> {skin?.geometrySummary}
              </p>

              <div className="grid min-w-0 grid-cols-1 gap-4 pt-1 md:grid-cols-3 [&>div]:min-w-0">
                <div className="flex flex-col gap-1">
                  <span className="text-ink-3 text-[11px] font-semibold">
                    {t('publicCopy.m289')}
                    {slide1.layout}
                    {t('publicCopy.m290')}
                  </span>
                  <div className="border-clay/40 overflow-hidden rounded-lg border shadow-sm">
                    <SlideThumb slide={slide1} theme={theme} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-ink-3 text-[11px] font-semibold">
                    {t('publicCopy.m291')}
                    {slide3.layout}
                    {t('publicCopy.m290')}
                  </span>
                  <div className="border-clay/40 overflow-hidden rounded-lg border shadow-sm">
                    <SlideThumb slide={slide3} theme={theme} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-ink-3 text-[11px] font-semibold">
                    {t('publicCopy.m292')}
                    {slideClosing.layout}
                    {t('publicCopy.m290')}
                  </span>
                  <div className="border-clay/40 overflow-hidden rounded-lg border shadow-sm">
                    <SlideThumb slide={slideClosing} theme={theme} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
