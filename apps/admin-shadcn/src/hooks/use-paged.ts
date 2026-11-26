'use client'

import { useEffect, useRef } from 'react'

import { useUrlState } from './use-url-state'

export function usePaged<T>(list: T[], size = 12, reset?: unknown) {
  const [stored, setPage] = useUrlState<string>('page', '1')
  const previousReset = useRef(reset)
  const pages = Math.max(1, Math.ceil(list.length / size))
  const requested = Number(stored)
  const page = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1
  useEffect(() => {
    if (previousReset.current !== reset) setPage('1')
    previousReset.current = reset
  }, [reset, setPage])
  const go = (next: number) => {
    setPage(String(Math.max(1, Math.min(pages, Math.trunc(next) || 1))))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return {
    items: list.slice((page - 1) * size, page * size),
    page,
    pages,
    go,
    offset: (page - 1) * size,
  }
}
