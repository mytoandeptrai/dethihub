'use client'
import { useEffect, useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type { lib_adminApi_AuditEntry as AuditEntry } from '@admin-pages-engine'
export function useAuditPanelContainer() {
  const { listAudit } = useAdminOperationsRequests()
  const [items, setItems] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reloadTick, setReloadTick] = useState(0)
  const perPage = 20
  useEffect(() => {
    let alive = true
    setLoading(true)
    listAudit({ page, perPage })
      .then((res) => {
        if (!alive) return
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((error) => {
        if (!alive) return
        console.error(t('adminOpsCopy.m179'), error)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [page, reloadTick, listAudit])
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return { viewState: 0 as const, setReloadTick, loading, items, totalPages, page, setPage }
}
