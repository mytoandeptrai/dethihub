'use client'
import {
  lib_adminPaymentsApi_creditPayment as creditPayment,
  lib_adminApi_getAiErrors as getAiErrors,
  lib_adminApi_getAiStats as getAiStats,
  lib_adminApi_getDbStatus as getDbStatus,
  lib_adminApi_getHealthTargets as getHealthTargets,
  lib_adminApi_getSettings as getSettings,
  lib_adminStatsApi_getStatsOnline as getStatsOnline,
  lib_adminStatsApi_getStatsOverview as getStatsOverview,
  lib_adminApi_listAudit as listAudit,
  lib_adminPaymentsApi_listPayments as listPayments,
  lib_adminApi_resetAiProvider as resetAiProvider,
  lib_adminApi_runHealth as runHealth,
  lib_adminApi_saveAiProvider as saveAiProvider,
  lib_adminApi_setAnnouncements as setAnnouncements,
  lib_adminApi_setMaintenance as setMaintenance,
  lib_adminApi_setPricing as setPricing,
  lib_adminApi_setWelcomePoints as setWelcomePoints,
  lib_adminPaymentsApi_syncPayment as syncPayment,
} from '@admin-pages-engine'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { adminRequest } from '@/modules/admin-pages/hooks/admin-request'
export function useAdminOperationsRequests() {
  const client = useQueryClient()
  const { mutateAsync } = useMutation({ mutationFn: (job: () => Promise<unknown>) => job() })
  return useMemo(
    () => ({
      getStatsOverview: adminRequest(client, mutateAsync, 'getStatsOverview', getStatsOverview),
      getStatsOnline: adminRequest(client, mutateAsync, 'getStatsOnline', getStatsOnline),
      getSettings: adminRequest(client, mutateAsync, 'getSettings', getSettings),
      creditPayment: adminRequest(client, mutateAsync, 'creditPayment', creditPayment),
      listPayments: adminRequest(client, mutateAsync, 'listPayments', listPayments),
      syncPayment: adminRequest(client, mutateAsync, 'syncPayment', syncPayment),
      setMaintenance: adminRequest(client, mutateAsync, 'setMaintenance', setMaintenance),
      runHealth: adminRequest(client, mutateAsync, 'runHealth', runHealth),
      getHealthTargets: adminRequest(client, mutateAsync, 'getHealthTargets', getHealthTargets),
      getAiStats: adminRequest(client, mutateAsync, 'getAiStats', getAiStats),
      getAiErrors: adminRequest(client, mutateAsync, 'getAiErrors', getAiErrors),
      listAudit: adminRequest(client, mutateAsync, 'listAudit', listAudit),
      resetAiProvider: adminRequest(client, mutateAsync, 'resetAiProvider', resetAiProvider),
      saveAiProvider: adminRequest(client, mutateAsync, 'saveAiProvider', saveAiProvider),
      getDbStatus: adminRequest(client, mutateAsync, 'getDbStatus', getDbStatus),
      setPricing: adminRequest(client, mutateAsync, 'setPricing', setPricing),
      setAnnouncements: adminRequest(client, mutateAsync, 'setAnnouncements', setAnnouncements),
      setWelcomePoints: adminRequest(client, mutateAsync, 'setWelcomePoints', setWelcomePoints),
    }),
    [client, mutateAsync],
  )
}
