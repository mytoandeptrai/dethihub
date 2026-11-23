'use client'
import { useMemo, useState } from 'react'

import type { lib_adminApi_Announcement as Announcement } from '@admin-pages-engine'
export function useAnnouncementPreview(items: Announcement[]) {
  const [page, setPage] = useState(0)
  const shown = useMemo(
    () => items.filter((a) => a.on && (!a.until || Date.parse(a.until) > Date.now())).slice(0, 5),
    [items],
  )
  const index = Math.min(page, Math.max(0, shown.length - 1))
  const go = (delta: number) =>
    setPage((current) => Math.max(0, Math.min(shown.length - 1, current + delta)))
  return { shown, index, setPage, go, item: shown[index] }
}
