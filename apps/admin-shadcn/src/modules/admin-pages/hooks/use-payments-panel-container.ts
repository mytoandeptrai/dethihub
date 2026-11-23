'use client'
import { dialog } from '@engine-dialogs'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'

import { t } from '@/i18n/translate'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'
import { useDrawerExit } from '@/modules/admin-pages/hooks/use-drawer-exit'

import type {
  lib_adminPaymentsApi_AdminPayment as AdminPayment,
  lib_adminApi_AppSettings as AppSettings,
  lib_adminPaymentsApi_PaymentFilter as PaymentFilter,
  lib_adminPaymentsApi_PaymentPage as PaymentPage,
  lib_adminPaymentsApi_RevenuePeriod as RevenuePeriod,
} from '@admin-pages-engine'
import type { ReactNode } from 'react'
export const fmt = (n: number) => n.toLocaleString('vi-VN')
export const PERIODS: {
  key: RevenuePeriod
  label: string
  title: string
}[] = [
  { key: 'day', label: t('adminOpsCopy.m39'), title: t('adminOpsCopy.m40') },
  { key: 'week', label: t('adminOpsCopy.m41'), title: t('adminOpsCopy.m42') },
  { key: 'month', label: t('adminOpsCopy.m43'), title: t('adminOpsCopy.m44') },
  { key: 'all', label: t('adminOpsCopy.m45'), title: t('adminOpsCopy.m46') },
]
export const PREV_LABEL = {
  day: t('adminOpsCopy.m47'),
  week: t('adminOpsCopy.m48'),
  month: t('adminOpsCopy.m49'),
} as const
export const STATUS: Record<
  AdminPayment['status'],
  {
    label: string
    tone: 'sage' | 'honey' | 'neutral' | 'clay'
  }
> = {
  paid: { label: t('adminOpsCopy.m50'), tone: 'sage' },
  pending: { label: t('adminOpsCopy.m51'), tone: 'honey' },
  expired: { label: t('adminOpsCopy.m52'), tone: 'neutral' },
  cancelled: { label: t('adminOpsCopy.m53'), tone: 'neutral' },
  failed: { label: t('adminOpsCopy.m54'), tone: 'clay' },
}
export function useDeltaContainer({
  cur,
  prev,
  label,
}: {
  cur: number
  prev: number
  label: string
}) {
  if (cur === 0 && prev === 0) return { viewState: 0 as const }
  const up = cur >= prev
  const diff = cur - prev
  const text =
    prev === 0
      ? t('adminOpsCopy.m55', { value0: label })
      : t('adminOpsCopy.m56', {
          value0: up ? '+' : '−',
          value1: String(Math.round((Math.abs(diff) / prev) * 100)),
          value2: label,
          value3: diff >= 0 ? '+' : '−',
          value4: fmt(Math.abs(diff)),
        })
  const Icon = up ? TrendingUp : TrendingDown
  return { viewState: 1 as const, up, Icon, text }
}
export function useMonthlyRevenueContainer({
  months,
}: {
  months: PaymentPage['revenue']['months']
}) {
  const max = Math.max(1, ...months.map((m) => m.vnd))
  return { viewState: 0 as const, months, max }
}
export function usePaymentsPanelContainer() {
  const { getSettings, creditPayment, listPayments, syncPayment } = useAdminOperationsRequests()
  const [tab, setTab] = useState<'orders' | 'pricing'>('orders')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [period, setPeriod] = useState<RevenuePeriod>('month')
  const [filter, setFilter] = useState<PaymentFilter>('all')
  const [page, setPage] = useState(1)
  const [code, setCode] = useState('')
  const readOrderCode = useEffectEvent(() => Number(code.replaceAll(/\D/g, '')) || undefined)
  const [data, setData] = useState<PaymentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const reload = () => setTick((current) => current + 1)
  useEffect(() => {
    if (tab !== 'pricing' || settings || pricingError !== null) return
    let alive = true
    getSettings()
      .then((result) => alive && setSettings(result))
      .catch(
        (error: unknown) =>
          alive && setPricingError(error instanceof Error ? error.message : t('adminOpsCopy.m57')),
      )
    return () => {
      alive = false
    }
  }, [tab, settings, pricingError, getSettings])
  useEffect(() => {
    let alive = true
    setLoading(true)
    const orderCode = readOrderCode()
    listPayments({ filter, page, orderCode })
      .then((r) => alive && setData(r))
      .catch(
        (error: unknown) =>
          alive &&
          void dialog.alert(error instanceof Error ? error.message : String(error), {
            title: t('adminOpsCopy.m58'),
          }),
      )
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [filter, page, tick, listPayments])
  const sync = async (p: AdminPayment) => {
    setBusy(p.orderCode)
    try {
      const r = await syncPayment(p.orderCode)
      const msg =
        r.status === 'paid'
          ? t('adminOpsCopy.m59')
          : r.payos === 'UNDERPAID'
            ? t('adminOpsCopy.m60')
            : t('adminOpsCopy.m62', {
                value0: r.payos ?? t('adminOpsCopy.m61'),
                value1: STATUS[r.status]?.label ?? r.status,
              })
      void dialog.alert(msg, { title: t('adminOpsCopy.m63', { value0: String(p.orderCode) }) })
      reload()
    } catch (error) {
      void dialog.alert(error instanceof Error ? error.message : String(error), {
        title: t('adminOpsCopy.m64'),
      })
    } finally {
      setBusy(null)
    }
  }
  const credit = async (p: AdminPayment) => {
    const note = await dialog.prompt(
      t('adminOpsCopy.m65', {
        value0: fmt(p.points),
        value1: p.email || p.userId,
        value2: String(p.orderCode),
        value3: fmt(p.vnd),
      }),
      { title: t('adminOpsCopy.m66'), confirmLabel: t('adminOpsCopy.m67') },
    )
    if (!note?.trim()) return
    setBusy(p.orderCode)
    try {
      await creditPayment(p.orderCode, note.trim())
      reload()
    } catch (error) {
      void dialog.alert(error instanceof Error ? error.message : String(error), {
        title: t('adminOpsCopy.m68'),
      })
    } finally {
      setBusy(null)
    }
  }
  const items = data?.items ?? []
  const selected = items.find((p) => p.orderCode === open) ?? null
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1
  return {
    viewState: 0 as const,
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
  }
}
export function useRowContainer({
  label,
  children,
  mono,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return { viewState: 0 as const, label, mono, children }
}
export function usePaymentDrawerContainer({
  p,
  busy,
  onSync,
  onCredit,
  onClose,
}: {
  p: AdminPayment
  busy: boolean
  onSync: () => void
  onCredit: () => void
  onClose: () => void
}) {
  const { close, panelClass } = useDrawerExit(onClose)
  return { viewState: 0 as const, close, panelClass, p, busy, onSync, onCredit }
}
