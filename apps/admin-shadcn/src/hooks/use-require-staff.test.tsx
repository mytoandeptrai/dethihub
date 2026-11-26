import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRequireStaff } from './use-require-staff'

const { me, missing } = vi.hoisted(() => ({
  me: { data: { role: null as string | null }, isSuccess: false, error: null as Error | null },
  missing: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/apis/me', () => ({ useMe: () => me }))
vi.mock('next/navigation', () => ({ notFound: missing }))

describe('staff access', () => {
  it.each(['admin', 'moderator'])('allows %s', (role) => {
    Object.assign(me, { data: { role }, isSuccess: true, error: null })
    const { result } = renderHook(() => useRequireStaff())
    expect(result.current.isLoading).toBe(false)
  })
  it('waits for a session and role before rendering protected content', () => {
    Object.assign(me, { data: { role: null }, isSuccess: false, error: null })
    const { result } = renderHook(() => useRequireStaff())
    expect(result.current.isLoading).toBe(true)
  })
  it('hides admin from non-staff with notFound', () => {
    Object.assign(me, { data: { role: null }, isSuccess: true, error: null })
    expect(() => renderHook(() => useRequireStaff())).toThrow('NEXT_NOT_FOUND')
  })
  it('surfaces API errors rather than treating them as a non-staff role', () => {
    Object.assign(me, { isSuccess: false, error: new Error('Hệ thống bận.') })
    expect(() => renderHook(() => useRequireStaff())).toThrow('Hệ thống bận.')
  })
})
