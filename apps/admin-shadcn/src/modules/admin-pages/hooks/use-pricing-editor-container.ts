'use client'
import { lib_pricing_DEFAULT_PRICING as DEFAULT_PRICING } from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type { lib_pricing_PricingConfig as PricingConfig } from '@admin-pages-engine'
export const fmt = (n: number) => n.toLocaleString('vi-VN')
export const toNum = (s: string) => Number(s.replaceAll(/\D/g, '')) || 0
export interface Row {
  key: string
  vnd: string
  bonus: string
}
export const toRows = (c: PricingConfig): Row[] =>
  c.packs.map((p) => ({
    key: crypto.randomUUID(),
    vnd: fmt(p.vnd),
    bonus: String(Math.round(p.bonus * 1000) / 10),
  }))
export function usePricingEditorContainer({
  initial,
  onNotice,
}: {
  initial: PricingConfig | null
  onNotice: (msg: string) => void
}) {
  const { setPricing } = useAdminOperationsRequests()
  const start = initial ?? DEFAULT_PRICING
  const [rate, setRate] = useState(String(start.pointsPer1000))
  const [minVnd, setMinVnd] = useState(fmt(start.minVnd))
  const [maxVnd, setMaxVnd] = useState(fmt(start.maxVnd))
  const [rows, setRows] = useState<Row[]>(() => toRows(start))
  const [defaultKey, setDefaultKey] = useState(() => {
    const i = start.packs.findIndex((p) => p.vnd === start.defaultVnd)
    return Math.max(i, 0)
  })
  const [saving, setSaving] = useState(false)
  const patch = (key: string, change: Partial<Row>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...change } : r)))
  const ratio = toNum(rate)
  const save = async () => {
    const packs = rows.map((r) => ({
      vnd: toNum(r.vnd),
      bonus: (Number(r.bonus.replace(',', '.')) || 0) / 100,
    }))
    setSaving(true)
    try {
      const saved = await setPricing({
        pointsPer1000: ratio,
        minVnd: toNum(minVnd),
        maxVnd: toNum(maxVnd),
        packs,
        defaultVnd: packs[defaultKey]?.vnd ?? packs[0]?.vnd ?? 0,
      })
      setRows(toRows(saved))
      setDefaultKey(
        Math.max(
          0,
          saved.packs.findIndex((p) => p.vnd === saved.defaultVnd),
        ),
      )
      onNotice(t('adminOpsCopy.m206'))
    } catch (error) {
      await dialog.alert(error instanceof Error ? error.message : t('adminOpsCopy.m207'), {
        title: t('adminOpsCopy.m208'),
      })
    } finally {
      setSaving(false)
    }
  }
  return {
    viewState: 0 as const,
    save,
    saving,
    rate,
    setRate,
    minVnd,
    setMinVnd,
    maxVnd,
    setMaxVnd,
    rows,
    ratio,
    patch,
    defaultKey,
    setDefaultKey,
    setRows,
  }
}
