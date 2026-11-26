'use client'

import { useEffect, useState } from 'react'

import type { loadDesignRows } from '@engine-designs'

type Rows = Awaited<ReturnType<typeof loadDesignRows>>

export function useDesignsContainer() {
  const [rows, setRows] = useState<Rows>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    void import('@engine-designs')
      .then((module) => module.loadDesignRows())
      .then((value) => {
        if (active) {
          setRows(value)
          setReady(true)
        }
      })
      .catch(() => {
        if (active) {
          setReady(true)
          setError(true)
        }
      })
    return () => {
      active = false
    }
  }, [])
  return { rows, ready, count: rows.length, error }
}
