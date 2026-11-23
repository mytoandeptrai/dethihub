'use client'
import { data_bank_loadFullBank as loadFullBank, useLocation } from '@admin-pages-engine'
import { useEffect, useState } from 'react'

import { useAdminRequests } from '@/modules/admin-pages/hooks/use-admin-requests'
export function useOverviewPanelContainer() {
  const { listUsers, getAiStats, listContentExams, listContentReports } = useAdminRequests()
  const { search } = useLocation()
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiCalls7d, setAiCalls7d] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [examCount, setExamCount] = useState<number | null>()
  const [openReports, setOpenReports] = useState(0)
  const [bankCount, setBankCount] = useState<number | null>()
  useEffect(() => {
    let alive = true
    listUsers({ perPage: 1 })
      .then((res) => {
        if (alive) setTotalUsers(res.total)
      })
      .catch(() => {
        if (alive) setTotalUsers(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    getAiStats(7)
      .then((res) => {
        if (!alive) return
        const sum = res.rows.reduce((acc, r) => acc + r.calls, 0)
        setAiCalls7d(sum)
      })
      .catch(() => {
        if (alive) setAiCalls7d(null)
      })
      .finally(() => {
        if (alive) setAiLoading(false)
      })
    listContentExams({ perPage: 1 })
      .then((res) => alive && setExamCount(res.total))
      .catch(() => alive && setExamCount(null))
    listContentReports({ status: 'open', perPage: 1 })
      .then((res) => alive && setOpenReports(res.total))
      .catch(() => {})
    loadFullBank()
      .then((b) => alive && setBankCount(b.length))
      .catch(() => alive && setBankCount(null))
    return () => {
      alive = false
    }
  }, [listUsers, getAiStats, listContentExams, listContentReports])
  return {
    viewState: 0 as const,
    loading,
    totalUsers,
    search,
    examCount,
    openReports,
    bankCount,
    aiLoading,
    aiCalls7d,
  }
}
