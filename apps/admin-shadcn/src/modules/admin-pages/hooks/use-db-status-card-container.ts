'use client'
import { lib_adminApi_clearAdminCache as clearAdminCache } from '@admin-pages-engine'
import { useCallback, useEffect, useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type { lib_adminApi_DbStatus as DbStatus } from '@admin-pages-engine'
export const REGION_LABEL: Record<string, string> = {
  'ap-southeast-1': 'Southeast Asia (Singapore)',
  'ap-southeast-2': 'Oceania (Sydney)',
  'ap-northeast-1': 'Northeast Asia (Tokyo)',
  'ap-northeast-2': 'Northeast Asia (Seoul)',
  'ap-south-1': 'South Asia (Mumbai)',
  'us-east-1': 'East US (North Virginia)',
  'us-west-1': 'West US (North California)',
  'eu-central-1': 'Central EU (Frankfurt)',
  'eu-west-1': 'West EU (Ireland)',
}
export const tone = (v: number | null) =>
  v === null ? 'text-ink-3' : v >= 90 ? 'text-clay' : v >= 75 ? 'text-honey' : 'text-ink'
export const fmtPct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`)
export function useSgFlagContainer() {
  return { viewState: 0 as const }
}
export function useDbStatusCardContainer() {
  const { getDbStatus } = useAdminOperationsRequests()
  const [st, setSt] = useState<DbStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(
    (fresh = false) => {
      if (fresh) clearAdminCache()
      setLoading(true)
      setErr(null)
      getDbStatus()
        .then(setSt)
        .catch((error: unknown) =>
          setErr(error instanceof Error ? error.message : t('adminOpsCopy.m198')),
        )
        .finally(() => setLoading(false))
    },
    [getDbStatus],
  )
  useEffect(() => load(), [load])
  const conns =
    typeof st?.connections === 'number' ? `${st.connections}/${st.maxConnections ?? '?'}` : '—'
  const connPct =
    typeof st?.connections === 'number' && st.maxConnections
      ? (st.connections / st.maxConnections) * 100
      : null
  return { viewState: 0 as const, st, load, loading, err, connPct, conns }
}
