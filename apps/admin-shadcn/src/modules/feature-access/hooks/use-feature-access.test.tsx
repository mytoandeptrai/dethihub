import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw/server'

import { useFeatureAccess } from './use-feature-access'

import type { ReactNode } from 'react'

vi.mock('@/apis/me', () => ({ useMe: () => ({ data: { role: role.value } }) }))
const role = vi.hoisted(() => ({ value: null as string | null }))

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  )
}

describe('feature access', () => {
  it.each([null, 'moderator', 'admin'])(
    'resolves flags for role %s without a loading flash',
    async (value) => {
      role.value = value
      server.use(
        http.get('http://localhost:3000/api/site/status', () =>
          HttpResponse.json({
            features: { word: false, slide: true, board: false, online: false },
          }),
        ),
      )
      const { result } = renderHook(useFeatureAccess, { wrapper })
      expect(result.current.canUse('word')).toBe(true)
      await waitFor(() => expect(result.current.isResolved).toBe(true))
      expect(result.current.canUse('word')).toBe(value !== null)
      expect(result.current.canUse('slide')).toBe(true)
      expect(result.current.isDisabled('word')).toBe(true)
    },
  )
  it('defaults missing flags to enabled', async () => {
    role.value = null
    server.use(
      http.get('http://localhost:3000/api/site/status', () =>
        HttpResponse.json({ features: { word: false } }),
      ),
    )
    const { result } = renderHook(useFeatureAccess, { wrapper })
    await waitFor(() => expect(result.current.isResolved).toBe(true))
    expect(result.current.canUse('online')).toBe(true)
  })
  it('keeps access enabled if site status fails', async () => {
    role.value = null
    server.use(
      http.get(
        'http://localhost:3000/api/site/status',
        () => new HttpResponse(null, { status: 503 }),
      ),
    )
    const { result } = renderHook(useFeatureAccess, { wrapper })
    await waitFor(() => expect(result.current.isResolved).toBe(true))
    expect(result.current.canUse('word')).toBe(true)
    expect(result.current.isDisabled('word')).toBe(false)
  })
})
