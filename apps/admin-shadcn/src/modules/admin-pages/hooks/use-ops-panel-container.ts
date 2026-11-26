'use client'
import { lib_adminApi_AdminError as AdminError } from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { Cpu, Database, HardDrive } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { toDatetimeLocalString, toIsoString } from '@/modules/admin-pages/hooks/admin-utils'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type { HealthDrawerTarget } from '@/modules/admin-pages/containers'
import type {
  lib_adminApi_AdminMe as AdminMe,
  lib_adminApi_AiStatRow as AiStatRow,
  lib_adminApi_AppSettings as AppSettings,
  lib_adminApi_HealthCheck as HealthCheck,
  lib_adminApi_HealthProvider as HealthProvider,
  lib_adminApi_HealthResult as HealthResult,
  lib_adminApi_HealthService as HealthService,
} from '@admin-pages-engine'
export interface OpsPanelProps {
  me?: AdminMe
}
export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '—'
  if (ms >= 1000) {
    return (ms / 1000).toFixed(1).replace('.', ',') + ' s'
  }
  return `${Math.round(ms)} ms`
}
export function formatViTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  const hh = String(vn.getUTCHours()).padStart(2, '0')
  const min = String(vn.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}
export function computeCostDisplay(rows: AiStatRow[]): string {
  const withCost = rows.filter((r) => r.cost !== null && r.cost !== undefined)
  if (withCost.length === 0) return t('adminOpsCopy.m105')
  const total = withCost.reduce((sum, r) => sum + (r.cost ?? 0), 0)
  if (total === 0) return '$0.00'
  if (total < 0.01) return `$${total.toFixed(4)}`
  return `$${total.toFixed(2)}`
}
export function useOpsPanelContainer({ me: _me }: OpsPanelProps) {
  const { getSettings, setMaintenance, runHealth, getHealthTargets, getAiStats, getAiErrors } =
    useAdminOperationsRequests()
  const [notice, setNotice] = useState<string | null>(null)
  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [maintOn, setMaintOn] = useState(false)
  const [savedMaintOn, setSavedMaintOn] = useState(false)
  const [maintMessage, setMaintMessage] = useState('')
  const [maintUntil, setMaintUntil] = useState('')
  const [savingMaint, setSavingMaint] = useState(false)
  const [opsTab, setOpsTab] = useState<'maint' | 'notice'>('maint')
  const [healthProviders, setHealthProviders] = useState<HealthProvider[]>([])
  const [healthResults, setHealthResults] = useState<Record<string, HealthCheck>>({})
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null)
  const [checkingOne, setCheckingOne] = useState<string[]>([])
  const [healthServices, setHealthServices] = useState<{
    supabase: HealthService
    r2: HealthService
  } | null>(null)
  const [healthDrawer, setHealthDrawer] = useState<HealthDrawerTarget | null>(null)
  const [runningHealth, setRunningHealth] = useState(false)
  const [statDays, setStatDays] = useState<'7' | '30'>('7')
  const [aiStatsRows, setAiStatsRows] = useState<AiStatRow[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [aiErrorResult, setAiErrorResult] = useState<Awaited<ReturnType<typeof getAiErrors>>>()
  const { items: aiErrors = [], freeEmpty } = aiErrorResult ?? {}
  const [loadingErrors, setLoadingErrors] = useState(true)
  useEffect(() => {
    let alive = true
    setLoadingSettings(true)
    getSettings()
      .then((st) => {
        if (!alive) return
        setSettings(st)
        setMaintOn(!!st.maintenance.on)
        setSavedMaintOn(!!st.maintenance.on)
        setMaintMessage(st.maintenance.message ?? '')
        setMaintUntil(toDatetimeLocalString(st.maintenance.until))
      })
      .catch((error: unknown) => {
        if (!alive) return
        const msg =
          error instanceof AdminError || error instanceof Error
            ? error.message
            : t('adminOpsCopy.m106')
        void dialog.alert(msg, { title: t('adminOpsCopy.m107') })
      })
      .finally(() => {
        if (alive) setLoadingSettings(false)
      })
    return () => {
      alive = false
    }
  }, [getSettings])
  useEffect(() => {
    let alive = true
    setLoadingStats(true)
    const days = statDays === '30' ? 30 : 7
    getAiStats(days)
      .then((res) => {
        if (!alive) return
        setAiStatsRows(res.rows)
      })
      .catch((error: unknown) => {
        if (!alive) return
        const msg =
          error instanceof AdminError || error instanceof Error
            ? error.message
            : t('adminOpsCopy.m108')
        void dialog.alert(msg, { title: t('adminOpsCopy.m109') })
      })
      .finally(() => {
        if (alive) setLoadingStats(false)
      })
    return () => {
      alive = false
    }
  }, [statDays, getAiStats])
  const loadErrors = useCallback(() => {
    setLoadingErrors(true)
    getAiErrors(30)
      .then((res) => {
        setAiErrorResult(res)
      })
      .catch((error: unknown) => {
        const msg =
          error instanceof AdminError || error instanceof Error
            ? error.message
            : t('adminOpsCopy.m110')
        void dialog.alert(msg, { title: t('adminOpsCopy.m111') })
      })
      .finally(() => {
        setLoadingErrors(false)
      })
  }, [getAiErrors])
  useEffect(() => {
    loadErrors()
  }, [loadErrors])
  const handleToggleMaintenance = async (nextOn: boolean) => {
    if (nextOn) {
      const ok = await dialog.confirm(t('adminOpsCopy.m112'), {
        title: t('adminOpsCopy.m113'),
        confirmLabel: t('adminOpsCopy.m114'),
        cancelLabel: t('adminOpsCopy.m115'),
        danger: true,
      })
      if (!ok) return
    }
    setMaintOn(nextOn)
  }
  const handleSaveMaintenance = async () => {
    try {
      setSavingMaint(true)
      await setMaintenance({
        on: maintOn,
        message: maintMessage.trim() || undefined,
        until: toIsoString(maintUntil),
      })
      setSavedMaintOn(maintOn)
      showNotice(t('adminOpsCopy.m116'))
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : t('adminOpsCopy.m117')
      await dialog.alert(msg, { title: t('adminOpsCopy.m118') })
    } finally {
      setSavingMaint(false)
    }
  }
  useEffect(() => {
    getHealthTargets()
      .then((r) => {
        setHealthProviders(r.providers)
        setHealthServices(r.services)
      })
      .catch(() => {})
  }, [getHealthTargets])
  const applyHealth = (res: HealthResult) => {
    setHealthCheckedAt(res.checkedAt)
    setHealthResults((cur) => ({
      ...cur,
      ...(res.supabase ? { supabase: res.supabase } : {}),
      ...(res.r2 ? { r2: res.r2 } : {}),
      ...Object.fromEntries((res.providers ?? []).map((p) => [p.provider, p])),
    }))
  }
  const healthError = async (err: unknown) => {
    const msg =
      err instanceof AdminError || err instanceof Error ? err.message : t('adminOpsCopy.m119')
    await dialog.alert(msg, { title: t('adminOpsCopy.m120') })
  }
  const handleRunHealth = async () => {
    try {
      setRunningHealth(true)
      const res = await runHealth()
      applyHealth(res)
      showNotice(t('adminOpsCopy.m121'))
    } catch (error: unknown) {
      await healthError(error)
    } finally {
      setRunningHealth(false)
    }
  }
  const handleCheckOne = async (key: string) => {
    setCheckingOne((list) => [...list, key])
    try {
      applyHealth(await runHealth(key))
    } catch (error: unknown) {
      await healthError(error)
    } finally {
      setCheckingOne((list) => list.filter((k) => k !== key))
    }
  }
  const healthRows: {
    key: string
    icon: typeof Cpu
    name: string
    note: string
    target: HealthDrawerTarget | null
  }[] = [
    {
      key: 'supabase',
      icon: Database,
      name: 'Supabase',
      note: t('adminOpsCopy.m122'),
      target: healthServices && { name: 'Supabase', service: healthServices.supabase },
    },
    {
      key: 'r2',
      icon: HardDrive,
      name: 'Cloudflare R2',
      note: t('adminOpsCopy.m123'),
      target: healthServices && { name: 'Cloudflare R2', service: healthServices.r2 },
    },
    ...healthProviders.map((p) => ({
      key: p.provider,
      icon: Cpu,
      name: p.provider,
      note: p.model,
      target: { name: p.provider, provider: p },
    })),
  ]
  const totalCalls = useMemo(() => aiStatsRows.reduce((sum, r) => sum + r.calls, 0), [aiStatsRows])
  const totalErrors = useMemo(
    () => aiStatsRows.reduce((sum, r) => sum + r.errors, 0),
    [aiStatsRows],
  )
  const totalTokens = useMemo(
    () => aiStatsRows.reduce((sum, r) => sum + r.tokens, 0),
    [aiStatsRows],
  )
  const errorRateStr = useMemo(() => {
    if (totalCalls === 0) return '0%'
    const rate = (totalErrors / totalCalls) * 100
    return rate.toFixed(1).replace('.', ',') + '%'
  }, [totalCalls, totalErrors])
  const totalCostStr = useMemo(() => computeCostDisplay(aiStatsRows), [aiStatsRows])
  const chartDays = useMemo(() => {
    const map = new Map<
      string,
      {
        day: string
        calls: number
        errors: number
        success: number
      }
    >()
    for (const r of aiStatsRows) {
      const cur = map.get(r.day) ?? { day: r.day, calls: 0, errors: 0, success: 0 }
      cur.calls += r.calls
      cur.errors += r.errors
      cur.success += Math.max(0, r.calls - r.errors)
      map.set(r.day, cur)
    }
    return [...map.values()].toSorted((a, b) => a.day.localeCompare(b.day))
  }, [aiStatsRows])
  const maxDailyCalls = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => d.calls))
  }, [chartDays])
  const modelStats = useMemo(() => {
    interface AggModel {
      model: string
      provider: string
      calls: number
      errors: number
      tokens: number
      cost: number | null
      hasCost: boolean
      totalMsCalls: number
    }
    const map = new Map<string, AggModel>()
    for (const r of aiStatsRows) {
      const key = `${r.provider}:::${r.model}`
      let cur = map.get(key)
      if (!cur) {
        cur = {
          model: r.model,
          provider: r.provider,
          calls: 0,
          errors: 0,
          tokens: 0,
          cost: null,
          hasCost: false,
          totalMsCalls: 0,
        }
        map.set(key, cur)
      }
      cur.calls += r.calls
      cur.errors += r.errors
      cur.tokens += r.tokens
      if (r.cost !== null && r.cost !== undefined) {
        cur.cost = (cur.cost ?? 0) + r.cost
        cur.hasCost = true
      }
      cur.totalMsCalls += r.avgMs * r.calls
    }
    const list = [...map.values()].map((m) => ({
      model: m.model,
      provider: m.provider,
      calls: m.calls,
      errors: m.errors,
      tokens: m.tokens,
      cost:
        m.hasCost && m.cost !== null
          ? m.cost < 0.01 && m.cost > 0
            ? `$${m.cost.toFixed(4)}`
            : `$${m.cost.toFixed(2)}`
          : '—',
      avgMs: m.calls > 0 ? Math.round(m.totalMsCalls / m.calls) : 0,
    }))
    return list.toSorted((a, b) => b.calls - a.calls)
  }, [aiStatsRows])
  return {
    viewState: 0 as const,
    notice,
    savedMaintOn,
    maintOn,
    loadingSettings,
    opsTab,
    setOpsTab,
    handleToggleMaintenance,
    savingMaint,
    maintMessage,
    setMaintMessage,
    maintUntil,
    setMaintUntil,
    handleSaveMaintenance,
    settings,
    showNotice,
    healthCheckedAt,
    handleRunHealth,
    runningHealth,
    healthRows,
    healthResults,
    checkingOne,
    setHealthDrawer,
    handleCheckOne,
    healthDrawer,
    setHealthProviders,
    statDays,
    setStatDays,
    loadingStats,
    totalCalls,
    errorRateStr,
    totalTokens,
    totalCostStr,
    chartDays,
    maxDailyCalls,
    modelStats,
    loadErrors,
    loadingErrors,
    aiErrors,
    freeEmpty,
  }
}
