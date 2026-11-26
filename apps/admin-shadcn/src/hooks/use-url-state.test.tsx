import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useUrlState } from './use-url-state'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))
afterEach(() => window.history.replaceState(null, '', '/'))

describe('url-backed workspace filters', () => {
  it('restores filters and preserves unrelated parameters and the hash', () => {
    window.history.replaceState({ preserved: true }, '', '/my-docs?view=list&q=To%C3%A1n#docs')
    const { result, rerender } = renderHook(() => useUrlState('view', 'grid', ['grid', 'list']))
    expect(result.current[0]).toBe('list')
    act(() => result.current[1]('grid'))
    rerender()
    expect(result.current[0]).toBe('grid')
    expect(window.location.search).toBe('?q=To%C3%A1n')
    expect(window.location.hash).toBe('#docs')
    expect(window.history.state).toEqual({ preserved: true })
  })

  it('uses defaults for absent and invalid enum values', () => {
    const { result, rerender } = renderHook(() => useUrlState('view', 'grid', ['grid', 'list']))
    expect(result.current[0]).toBe('grid')
    window.history.replaceState(null, '', '/my-docs?view=unknown')
    rerender()
    expect(result.current[0]).toBe('grid')
  })

  it('does not mark user updates as internal Next router changes', () => {
    window.history.replaceState({ __NA: true, _N: true, preserved: true }, '', '/my-docs')
    const replace = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => useUrlState('view', 'grid', ['grid', 'list']))
    act(() => result.current[1]('list'))
    expect(replace).toHaveBeenLastCalledWith({ preserved: true }, '', '/my-docs?view=list')
    replace.mockRestore()
  })
})
