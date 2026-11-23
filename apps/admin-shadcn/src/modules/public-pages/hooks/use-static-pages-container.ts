'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { t } from '@/i18n/translate'
export function useNotFoundContainer() {
  const pathname = usePathname()
  const [requestedPath, setRequestedPath] = useState('')
  useEffect(() => setRequestedPath(pathname), [pathname])
  useEffect(() => {
    const previous = document.title
    document.title = t('publicCopy.m275')
    return () => {
      document.title = previous
    }
  }, [])
  return { requestedPath }
}
export function useLegalContainer(kind: 'privacy' | 'terms') {
  return { kind }
}
