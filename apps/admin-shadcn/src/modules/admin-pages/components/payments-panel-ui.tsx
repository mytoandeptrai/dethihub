'use client'
import { TableRowsSkeleton, LoadingRegion, FormSkeleton } from '@/components/page-skeleton'
import { dialog } from '@engine-dialogs'
import { cn } from '@workspace/ui/lib/utils'
import { RefreshCw, Search, Wallet, X } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  DropdownMenuItem,
  EmptyState,
  inputClass,
  PageHeader,
  Pager,
  Segmented,

  Toolbar,
} from '@/components/product-ui'
import { t } from '@/i18n/translate'
import {
  AdminDrawer,
  AdminRowActions,
  AdminTable,
} from '@/modules/admin-pages/components/admin-primitives-ui'
import PricingEditor from '@/modules/admin-pages/containers/pricing-editor-container'
import { PaymentsPanelModel } from '@/modules/admin-pages/hooks'
import { formatViDateTime } from '@/modules/admin-pages/hooks/admin-utils'

import type {
  PaymentsPanelParts as Imported0,
  PaymentsPanelParts as Imported1,
  PaymentsPanelParts as Imported2,
  PaymentsPanelParts as Imported3,
  PaymentsPanelParts as Imported4,
} from '@/modules/admin-pages/containers/payments-panel-container/payments-panel-container'
const { fmt, STATUS, PERIODS, PREV_LABEL } = PaymentsPanelModel
export function PaymentsPanelDeltaUi(
  props: ReturnType<typeof PaymentsPanelModel.useDeltaContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    return null
  }
  if (props.viewState === 1) {
    const { up, Icon, text } = props
    return (
      <div
        className={cn(
          'mt-1 flex items-center gap-1 text-[12.5px] font-medium',
          up ? 'text-sage' : 'text-clay',
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="min-w-0">{text}</span>
      </div>
    )
  }
  return null
}
export function PaymentsPanelMonthlyRevenueUi(
  props: ReturnType<typeof PaymentsPanelModel.useMonthlyRevenueContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const { months, max } = props
    return (
      <Card className="border-line shadow-soft border px-4 py-3.5">
        <div className="text-ink-3 mb-2 text-[12.5px]">{t('adminOpsCopy.m90')}</div>
        <ul className="space-y-1.5">
          {months.map((m, i) => {
            const [y, mo] = m.month.split('-')
            return (
              <li key={m.month} className="flex items-center gap-3 text-[13.5px]">
                <span className="text-ink-2 tnum w-[72px] shrink-0">{`${Number(mo)}/${y}`}</span>
                <span className="bg-sunken h-2 min-w-0 flex-1 overflow-hidden rounded-full">
                  <span
                    className={cn('block h-full rounded-full', i === 0 ? 'bg-clay' : 'bg-sage')}
                    style={{ width: `${Math.max(2, (m.vnd / max) * 100)}%` }}
                  />
                </span>
                <span className="text-ink tnum w-[92px] shrink-0 text-right font-semibold">
                  {fmt(m.vnd)}
                  {t('adminOpsCopy.m87')}
                </span>
                <span className="text-ink-3 tnum hidden w-12 shrink-0 text-right sm:block">
                  {m.count}
                  {t('adminOpsCopy.m91')}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    )
  }
  return null
}
export function PaymentsPanelPaymentsPanelUi(
  props: ReturnType<typeof PaymentsPanelModel.usePaymentsPanelContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    const {
      tab,
      setTab,
      reload,
      loading,
      data,
      period,
      setPeriod,
      filter,
      setFilter,
      setPage,
      code,
      setCode,
      items,
      setOpen,
      open,
      pages,
      page,
      selected,
      busy,
      sync,
      credit,
      settings,
      pricingError,
      setPricingError,
    } = props
    const { Delta, MonthlyRevenue, PaymentDrawer } = props.parts
    const orders = (
      <div className="space-y-6">
        {data && !data.configured ? (
          <div className="border-honey/40 bg-honey-soft text-ink-2 rounded-[8px] border px-4 py-3 text-[13.5px]">
            {t('adminOpsCopy.m69')}
          </div>
        ) : null}

        <div className="space-y-3">
          <Segmented
            value={period}
            onChange={setPeriod}
            label={t('adminOpsCopy.m70')}
            options={PERIODS.map(({ key, label }) => ({ key, label }))}
            className="[&>button]:px-2.5 sm:[&>button]:px-4"
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: PERIODS.find((p) => p.key === period)!.title,
                value: data ? t('adminOpsCopy.m71', { value0: fmt(data.revenue[period]) }) : '…',
                delta:
                  data && period !== 'all' ? (
                    <Delta
                      cur={data.revenue[period]}
                      prev={data.revenue.prev[period].vnd}
                      label={PREV_LABEL[period]}
                    />
                  ) : null,
              },
              {
                label: t('adminOpsCopy.m72'),
                value: data ? fmt(data.revenue.counts[period]) : '…',
                delta:
                  data && period !== 'all' ? (
                    <Delta
                      cur={data.revenue.counts[period]}
                      prev={data.revenue.prev[period].count}
                      label={PREV_LABEL[period]}
                    />
                  ) : null,
              },
            ].map((c) => (
              <Card key={c.label} className="border-line shadow-soft min-w-0 border px-4 py-3.5">
                <div className="text-ink-3 text-[12.5px]">{c.label}</div>
                <div className="text-ink tnum mt-1 truncate text-[19px] font-bold sm:text-[20px]">
                  {c.value}
                </div>
                {c.delta}
              </Card>
            ))}
          </div>
          {data && data.revenue.months.length > 0 ? (
            <MonthlyRevenue months={data.revenue.months} />
          ) : null}
        </div>

        <Toolbar className="flex-col items-stretch lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={filter}
            onChange={(f) => {
              setFilter(f)
              setPage(1)
            }}
            label={t('adminOpsCopy.m73')}
            options={[
              { key: 'all', label: t('adminOpsCopy.m45') },
              { key: 'attention', label: t('adminOpsCopy.m74') },
              { key: 'pending', label: t('adminOpsCopy.m51') },
              { key: 'paid', label: t('adminOpsCopy.m50') },
              { key: 'closed', label: t('adminOpsCopy.m75') },
            ]}
          />
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              reload()
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder={t('adminOpsCopy.m76')}
              aria-label={t('adminOpsCopy.m77')}
              className={cn(inputClass, 'h-9 min-w-0 flex-1 sm:w-40 sm:flex-none')}
            />
            <Button type="submit" variant="outline" size="sm" aria-label={t('adminOpsCopy.m78')}>
              <Search className="size-3.5" />
            </Button>
          </form>
        </Toolbar>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="max-h-[65vh] overflow-auto overscroll-contain">
            <AdminTable className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
              <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider whitespace-nowrap uppercase">
                <tr>
                  <th className="px-4 py-3">{t('adminOpsCopy.m76')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m79')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m80')}</th>
                  <th className="px-4 py-3 text-right">{t('adminOpsCopy.m81')}</th>
                  <th className="px-4 py-3 text-right">{t('adminOpsCopy.m82')}</th>
                  <th className="px-4 py-3">{t('adminOpsCopy.m83')}</th>
                  <th aria-label={t('adminOpsCopy.m84')} />
                </tr>
              </thead>
              <tbody className="divide-line-2 divide-y">
                {loading && items.length === 0 ? (
                  <TableRowsSkeleton columns={7} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState
                        icon={<Wallet className="text-ink-4 size-6" />}
                        title={t('adminOpsCopy.m86')}
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr
                      key={p.orderCode}
                      onClick={() => setOpen(p.orderCode)}
                      className={cn(
                        'hover:bg-sunken/40 cursor-pointer transition-colors',
                        p.attention && 'bg-honey-soft/40',
                        open === p.orderCode && 'bg-sunken/60',
                      )}
                    >
                      <td className="text-ink-2 px-4 py-3 font-mono text-[12.5px] whitespace-nowrap">
                        {p.orderCode}
                      </td>
                      <td className="tnum text-ink-2 px-4 py-3 whitespace-nowrap">
                        {formatViDateTime(p.createdAt)}
                      </td>
                      <td className="text-ink max-w-[14rem] truncate px-4 py-3" data-tip={p.userId}>
                        {p.email || p.userId}
                      </td>
                      <td className="tnum text-ink px-4 py-3 text-right font-semibold whitespace-nowrap">
                        {fmt(p.vnd)}
                        {t('adminOpsCopy.m87')}
                      </td>
                      <td className="tnum text-ink-2 px-4 py-3 text-right whitespace-nowrap">
                        {fmt(p.points)}
                        {p.bonusPoints ? (
                          <span className="text-clay ml-1 text-[12px]">
                            {t('adminOpsCopy.m88')}
                            {fmt(p.bonusPoints)}
                            {t('adminOpsCopy.m33')}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone={STATUS[p.status]?.tone ?? 'neutral'}>
                          {STATUS[p.status]?.label ?? p.status}
                        </Badge>
                      </td>
                      <td>
                        <AdminRowActions>
                          <DropdownMenuItem onSelect={() => setOpen(p.orderCode)}>
                            {t('adminOpsCopy.m89')}
                            {p.orderCode}
                          </DropdownMenuItem>
                        </AdminRowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminTable>
          </div>
          {pages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={pages} go={setPage} />
            </div>
          ) : null}
        </Card>

        {selected ? (
          <PaymentDrawer
            key={selected.orderCode}
            p={selected}
            busy={busy === selected.orderCode}
            onSync={() => void sync(selected)}
            onCredit={() => void credit(selected)}
            onClose={() => setOpen(null)}
          />
        ) : null}
      </div>
    )
    return (
      <div className="space-y-6">
        <PageHeader title={t('adminOpsCopy.m92')} className="mb-0 [&_h1]:text-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={tab}
            onChange={setTab}
            label={t('adminOpsCopy.m92')}
            options={[
              { key: 'orders', label: t('adminOpsCopy.m93') },
              { key: 'pricing', label: t('adminOpsCopy.m94') },
            ]}
          />
          {tab === 'orders' ? (
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              <span>{t('adminOpsCopy.m95')}</span>
            </Button>
          ) : null}
        </div>
        {tab === 'orders' ? orders : null}
        {settings ? (
          <div hidden={tab !== 'pricing'}>
            <PricingEditor
              initial={settings.pricing}
              onNotice={(msg) => void dialog.alert(msg, { title: t('adminOpsCopy.m94') })}
            />
          </div>
        ) : tab === 'pricing' ? (
          pricingError === null ? (
            <LoadingRegion><FormSkeleton /></LoadingRegion>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p role="alert" className="text-clay text-[13px]">
                {pricingError}
              </p>
              <Button variant="outline" size="sm" onClick={() => setPricingError(null)}>
                {t('adminOpsCopy.m96')}
              </Button>
            </div>
          )
        ) : null}
      </div>
    )
  }
  return null
}
export function PaymentsPanelRowUi(
  props: ReturnType<typeof PaymentsPanelModel.useRowContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    const { label, mono, children } = props
    return (
      <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5 sm:grid-cols-[7rem_1fr]">
        <dt className="text-ink-3 text-[13px]">{label}</dt>
        <dd
          className={cn(
            'text-ink min-w-0 text-[13.5px] break-all',
            mono && 'font-mono text-[12.5px]',
          )}
        >
          {children}
        </dd>
      </div>
    )
  }
  return null
}
export function PaymentsPanelPaymentDrawerUi(
  props: ReturnType<typeof PaymentsPanelModel.usePaymentDrawerContainer> & {
    parts: typeof Imported4
  },
) {
  const { Row } = props.parts
  if (props.viewState === 0) {
    const { close, panelClass, p, busy, onSync, onCredit } = props
    return (
      <AdminDrawer
        onClose={close}
        className={cn(
          'border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l shadow-2xl sm:w-[440px]',
          panelClass,
        )}
        aria-label={t('adminOpsCopy.m63', { value0: String(p.orderCode) })}
      >
        <div className="border-line flex items-center justify-between border-b px-4 py-3.5 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-ink font-mono text-[16px] font-bold">{p.orderCode}</h2>
            <div className="mt-1">
              <Badge tone={STATUS[p.status]?.tone ?? 'neutral'}>
                {STATUS[p.status]?.label ?? p.status}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5"
            aria-label={t('adminOpsCopy.m35')}
          >
            <X className="size-5" />
          </button>
        </div>

        <dl className="divide-line-2 flex-1 divide-y overflow-y-auto px-4 py-2 sm:px-6">
          <Row label={t('adminOpsCopy.m80')}>{p.email || '—'}</Row>
          <Row label={t('adminOpsCopy.m98')} mono>
            {p.userId}
          </Row>
          <Row label={t('adminOpsCopy.m81')}>
            <span className="tnum font-semibold">
              {fmt(p.vnd)}
              {t('adminOpsCopy.m87')}
            </span>
          </Row>
          <Row label={t('adminOpsCopy.m82')}>
            <span className="tnum">
              {fmt(p.points)}
              {p.bonusPoints ? (
                <span className="text-clay ml-1">
                  {t('adminOpsCopy.m99')}
                  {fmt(p.bonusPoints)}
                  {t('adminOpsCopy.m33')}
                </span>
              ) : null}
            </span>
          </Row>
          <Row label={t('adminOpsCopy.m100')} mono>
            {t('adminOpsCopy.m101')}
            {p.orderCode}
          </Row>
          <Row label={t('adminOpsCopy.m79')}>{formatViDateTime(p.createdAt)}</Row>
          <Row label={t('adminOpsCopy.m102')}>{p.paidAt ? formatViDateTime(p.paidAt) : '—'}</Row>
          <Row label={t('adminOpsCopy.m103')} mono>
            {p.reference || '—'}
          </Row>
        </dl>

        {p.status === 'paid' ? null : (
          <div className="border-line flex gap-2 border-t px-4 py-3.5 sm:px-6 sm:py-4">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={onSync}>
              {t('adminOpsCopy.m104')}
            </Button>
            <Button variant="outline" className="flex-1" disabled={busy} onClick={onCredit}>
              {t('adminOpsCopy.m66')}
            </Button>
          </div>
        )}
      </AdminDrawer>
    )
  }
  return null
}
