'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type {
  lib_adminApi_AdminMe as AdminMe,
  lib_adminStatsApi_OnlineUser as OnlineUser,
  lib_adminStatsApi_StatsOnline as StatsOnline,
  lib_adminStatsApi_StatsOverview as StatsOverview,
} from '@admin-pages-engine'
export interface StatsPanelProps {
  me: AdminMe
}
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (isNaN(ms) || ms < 0) return t('adminOpsCopy.m1')
  const secs = Math.floor(ms / 1000)
  if (secs < 30) return t('adminOpsCopy.m1')
  if (secs < 60) return t('adminOpsCopy.m2', { value0: String(secs) })
  const mins = Math.floor(secs / 60)
  return t('adminOpsCopy.m3', { value0: String(mins) })
}
export function useStatsPanelContainer({ me: _me }: StatsPanelProps) {
  const { getStatsOverview, getStatsOnline } = useAdminOperationsRequests()
  const [days, setDays] = useState<'7' | '30' | '90'>('7')
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [onlineData, setOnlineData] = useState<StatsOnline | null>(null)
  const [loadingOnline, setLoadingOnline] = useState(false)
  const [showOnlineModal, setShowOnlineModal] = useState(false)
  const loadOverview = useCallback(
    async (selectedDays: '7' | '30' | '90', isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const numDays = Number(selectedDays) as 7 | 30 | 90
        const data = await getStatsOverview(numDays)
        setStats(data)
      } catch {
      } finally {
        setLoading(false)
        setInitialLoading(false)
        setRefreshing(false)
      }
    },
    [getStatsOverview],
  )
  const loadOnline = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoadingOnline(true)
      try {
        const data = await getStatsOnline()
        setOnlineData(data)
      } catch {
      } finally {
        if (showLoading) setLoadingOnline(false)
      }
    },
    [getStatsOnline],
  )
  useEffect(() => {
    void loadOverview(days)
  }, [days, loadOverview])
  useEffect(() => {
    void loadOnline()
    const timer = setInterval(() => {
      void loadOnline()
    }, 60_000)
    return () => clearInterval(timer)
  }, [loadOnline])
  const handleOpenOnlineModal = () => {
    setShowOnlineModal(true)
    void loadOnline(true)
  }
  const chartDays = useMemo(() => stats?.chartDays ?? [], [stats])
  const newUsersInPeriod = useMemo(() => {
    return chartDays.reduce((acc, d) => acc + (d.newUsers || 0), 0)
  }, [chartDays])
  const maxDailyNewUsers = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => d.newUsers || 0))
  }, [chartDays])
  const maxDailyItems = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => (d.newDocs || 0) + (d.newDecks || 0)))
  }, [chartDays])
  const totalItemsInPeriod = useMemo(() => {
    return chartDays.reduce((acc, d) => acc + (d.newDocs || 0) + (d.newDecks || 0), 0)
  }, [chartDays])
  const onlineUsers: OnlineUser[] = onlineData?.users ?? []
  const currentOnlineCount = onlineData?.onlineCount ?? stats?.onlineCount ?? 0
  return {
    viewState: 0 as const,
    days,
    setDays,
    loadOverview,
    loadOnline,
    loading,
    initialLoading,
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
  }
}
