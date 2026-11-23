'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import type { Dispatch, SetStateAction } from 'react'

export function useUrlState<T extends string>(
  key: string,
  initial: T,
  allowed?: readonly T[],
): [T, Dispatch<SetStateAction<T>>] {
  const search = useSearchParams()
  const parse = useCallback(
    (raw: string | null): T =>
      raw !== null && (!allowed || allowed.includes(raw as T)) ? (raw as T) : initial,
    [initial, allowed],
  )
  const value = parse(search.get(key))
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const params = new URLSearchParams(window.location.search)
      const updated = typeof next === 'function' ? next(parse(params.get(key))) : next
      if (updated === initial) params.delete(key)
      else params.set(key, updated)
      const query = params.toString()
      const state = { ...window.history.state }
      delete state.__NA
      delete state._N
      window.history.replaceState(
        state,
        '',
        window.location.pathname + (query ? '?' + query : '') + window.location.hash,
      )
    },
    [key, initial, parse],
  )
  return [value, setValue]
}
