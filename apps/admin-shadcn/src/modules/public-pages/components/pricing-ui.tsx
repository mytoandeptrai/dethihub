'use client'
import { DEFAULT_PACK_VND, basePoints } from '@engine-pricing'
import { cn } from '@workspace/ui/lib/utils'

import { PageSkeleton } from '@/components/page-skeleton'
import { t } from '@/i18n/translate'
import { PageHeader, PageShell } from '@/modules/public-pages/components/page-header-ui'
import {
  Button,
  Card,
  Segmented,
  inputClass,
} from '@/modules/public-pages/components/public-primitives-ui'
import PayCheckout from '@/modules/public-pages/containers/checkout-container'

import type { usePricingContainer } from '@/modules/public-pages/hooks'
const fmt = (n: number) => n.toLocaleString('vi-VN')
export default function PricingContentUi(props: ReturnType<typeof usePricingContainer>) {
  const {
    session,
    pricingError,
    inputId,
    inputRef,
    rawInput,
    inputError,
    paying,
    checkout,
    selectedPackVnd,
    mode,
    summary,
    estimatedUses,
    selectPack,
    handleModeChange,
    handleInputChange,
    handleInputBlur,
    handlePayClick,
    closeCheckout,
    onPaid,
    PACKS,
  } = props
  if (props.loading) return <PageSkeleton variant="cards" />
  return (
    <PageShell>
      {pricingError && <p role="alert">{pricingError}</p>}
      <PageHeader title={t('publicCopy.m293')} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
          <section aria-labelledby="pricing-packs-heading">
            <h2 id="pricing-packs-heading" className="text-ink text-[0.9375rem] font-semibold">
              {t('publicCopy.m294')}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {PACKS.map((pack) => {
                const firstTime = pack.firstTime
                const base = basePoints(pack.vnd)
                const pts = pack.points
                const hasBonus = firstTime && pack.bonus > 0
                const selected = selectedPackVnd === pack.vnd
                return (
                  <Card asChild key={pack.vnd} className="rounded-xl">
                    <button
                      key={pack.vnd}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectPack(pack)}
                      className={cn(
                        'relative flex min-w-0 flex-col px-4 pt-5 pb-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
                        selected
                          ? 'border-clay bg-clay-tint shadow-[inset_0_0_0_1px_var(--color-clay)]'
                          : 'border-line bg-surface hover:border-line-2',
                      )}
                    >
                      <span className="text-ink tnum text-[1.25rem] leading-tight font-bold">
                        {fmt(pack.vnd)}
                        {t('publicCopy.m295')}
                      </span>

                      <div className="border-line mt-3 border-t pt-2.5">
                        <div className="text-ink-2 tnum text-[0.9375rem] font-semibold">
                          {fmt(pts)}
                          {t('publicCopy.m134')}
                        </div>

                        <div className="mt-1 h-[1.125rem]">
                          {hasBonus ? (
                            <span
                              data-tip={t('publicCopy.m296', { value0: fmt(pts - base) })}
                              className="bg-clay-soft text-clay tnum inline-block rounded-full px-1.5 py-px text-[0.6875rem] leading-snug font-semibold"
                            >
                              {t('publicCopy.m297')}
                              {Math.round(pack.bonus * 100)}
                              {t('publicCopy.m298')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </Card>
                )
              })}
            </div>
          </section>

          <section
            aria-labelledby="pricing-custom-heading"
            className="border-line bg-surface rounded-[10px] border p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pricing-custom-heading" className="text-ink text-[0.9375rem] font-semibold">
                {t('publicCopy.m299')}
              </h2>
              <Segmented
                value={mode}
                onChange={handleModeChange}
                label={t('publicCopy.m300')}
                className="h-auto min-h-11"
                options={[
                  { key: 'vnd', label: t('publicCopy.m301') },
                  { key: 'points', label: t('publicCopy.m302') },
                ]}
              />
            </div>

            <div className="mt-3.5">
              <label htmlFor={inputId} className="sr-only">
                {mode === 'vnd' ? t('publicCopy.m303') : t('publicCopy.m304')}
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  value={rawInput}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  aria-invalid={inputError ? true : undefined}
                  placeholder={
                    mode === 'vnd' ? fmt(DEFAULT_PACK_VND) : fmt(basePoints(DEFAULT_PACK_VND))
                  }
                  className={cn(inputClass, 'tnum min-h-11 pr-16 text-[1rem] font-semibold')}
                />
                <span className="text-ink-3 pointer-events-none absolute inset-y-0 right-4 flex items-center text-[0.875rem] font-medium">
                  {mode === 'vnd' ? t('publicCopy.m295') : t('publicCopy.m305')}
                </span>
              </div>

              {inputError ? (
                <p role="alert" className="text-clay-deep mt-1.5 text-[0.8125rem] font-medium">
                  {inputError}
                </p>
              ) : (
                <p className="text-ink-2 tnum mt-2 text-[0.875rem]">
                  {mode === 'vnd' ? (
                    <>
                      {t('publicCopy.m306')}{' '}
                      <strong className="text-ink font-semibold">
                        {fmt(summary.points)}
                        {t('publicCopy.m134')}
                      </strong>
                    </>
                  ) : (
                    <>
                      {t('publicCopy.m301')}{' '}
                      <strong className="text-ink font-semibold">
                        {fmt(summary.vnd)}
                        {t('publicCopy.m295')}
                      </strong>
                      {' · '}
                      {t('publicCopy.m307')}{' '}
                      <strong className="text-ink font-semibold">
                        {fmt(summary.points)}
                        {t('publicCopy.m134')}
                      </strong>
                    </>
                  )}
                </p>
              )}
            </div>
          </section>

          <section
            aria-labelledby="pricing-usage-heading"
            className="border-line bg-surface rounded-[10px] border p-4 sm:p-5"
          >
            <h2 id="pricing-usage-heading" className="text-ink text-[0.9375rem] font-semibold">
              {t('publicCopy.m308')}
            </h2>
            <ul className="divide-line mt-3 divide-y">
              {estimatedUses.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-[0.875rem]"
                >
                  <span className="text-ink min-w-[10rem] flex-1">{item.label}</span>
                  <div className="tnum ml-auto flex shrink-0 flex-wrap items-baseline justify-end gap-x-3 gap-y-0.5 text-right">
                    <span className="text-ink-3 text-[0.8125rem]">
                      {item.min === item.points
                        ? fmt(item.points)
                        : `${fmt(item.min)}–${fmt(item.points)}`}
                      {t('publicCopy.m309')}
                    </span>
                    <span className="text-ink min-w-[5rem] font-semibold">
                      {t('publicCopy.m310')}
                      {fmt(item.count)}
                      {t('publicCopy.m311')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-ink-3 mt-3 text-[0.75rem]">{t('publicCopy.m312')}</p>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:col-span-5 xl:col-span-4">
          <Card className="border-clay/25 rounded-xl p-5 sm:p-6">
            <h2 className="text-ink text-[0.9375rem] font-semibold">{t('publicCopy.m313')}</h2>

            <dl className="border-line mt-3 space-y-2 border-b pb-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-ink-3 text-[0.875rem]">{t('publicCopy.m301')}</dt>
                <dd className="text-ink tnum text-[1rem] font-semibold">
                  {fmt(summary.vnd)}
                  {t('publicCopy.m295')}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-ink-3 text-[0.875rem]">{t('publicCopy.m302')}</dt>
                <dd className="flex flex-wrap items-baseline justify-end gap-2">
                  {summary.pack && summary.firstTime && summary.pack.bonus > 0 ? (
                    <span className="bg-clay-soft text-clay rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold">
                      {t('publicCopy.m297')}
                      {Math.round(summary.pack.bonus * 100)}
                      {t('publicCopy.m314')}
                    </span>
                  ) : null}
                  <span className="text-clay tnum text-[1.25rem] leading-tight font-bold">
                    {fmt(summary.points)}
                    {t('publicCopy.m134')}
                  </span>
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="clay"
              onClick={handlePayClick}
              disabled={paying || !!inputError}
              className="mt-4 h-auto min-h-11 w-full py-2.5 text-[0.9375rem] whitespace-normal"
            >
              {session
                ? paying
                  ? t('publicCopy.m315')
                  : t('publicCopy.m316', { value0: fmt(summary.vnd) })
                : t('publicCopy.m317')}
            </Button>
          </Card>
        </aside>
      </div>

      {checkout ? <PayCheckout order={checkout} onClose={closeCheckout} onPaid={onPaid} /> : null}
    </PageShell>
  )
}
