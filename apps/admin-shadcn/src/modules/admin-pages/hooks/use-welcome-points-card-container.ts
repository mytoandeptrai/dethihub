'use client'
import { dialog } from '@engine-dialogs'
import { useState } from 'react'

import { t } from '@/i18n/translate-admin-ops'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'
export function useWelcomePointsCardContainer({
  initial,
  onNotice,
}: {
  initial: number | null
  onNotice: (msg: string) => void
}) {
  const { setWelcomePoints } = useAdminOperationsRequests()
  const [value, setValue] = useState(String(initial ?? 120))
  const [saving, setSaving] = useState(false)
  const save = async () => {
    const points = Number(value)
    if (!/^\d+$/.test(value.trim()) || points > 10_000) {
      await dialog.alert(t('adminOpsCopy.m245'), { title: t('adminOpsCopy.m246') })
      return
    }
    setSaving(true)
    try {
      setValue(String(await setWelcomePoints(points)))
      onNotice(t('adminOpsCopy.m247'))
    } catch (error) {
      await dialog.alert(error instanceof Error ? error.message : t('adminOpsCopy.m248'), {
        title: t('adminOpsCopy.m249'),
      })
    } finally {
      setSaving(false)
    }
  }
  return { viewState: 0 as const, value, setValue, saving, save }
}
