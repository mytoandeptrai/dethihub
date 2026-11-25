import { applyPricing, DEFAULT_PRICING } from '@engine-pricing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommunityContainer } from '@/modules/community/hooks/use-community-container'
import { communityFixtureCard } from '@/modules/community/testing/fixture'
import { server } from '@/testing/msw/server'

import { useProductPricing } from './hooks/use-product-pricing'

import type { components } from '@workspace/api-types'
import type { ReactNode } from 'react'

const auth = vi.hoisted(() => ({ pending: true }))
vi.mock('@/hooks', async (original) => ({
  ...(await original<object>()),
  useSession: () => ({ session: null, isLoading: auth.pending }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/community',
  useSearchParams: () => new URLSearchParams(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const pricing = { ...DEFAULT_PRICING, pointsPer1000: 10 }
const card = communityFixtureCard as unknown as components['schemas']['ExamCardDto']
beforeEach(() => {
  auth.pending = true
  server.use(http.get('http://localhost:3000/api/exams/authors', () => HttpResponse.json([])))
})
afterEach(() => applyPricing(DEFAULT_PRICING))

describe('server pricing hydration', () => {
  it('uses server prices immediately and refreshes in the background', async () => {
    server.use(
      http.get('http://localhost:3000/api/billing/pricing', () =>
        HttpResponse.json({ ...pricing, pointsPer1000: 11 }),
      ),
    )
    const { result } = renderHook(() => useProductPricing(pricing), { wrapper })
    expect(result.current.isPending).toBe(false)
    expect(result.current.data).toEqual(pricing)
    await waitFor(() => expect(result.current.data?.pointsPer1000).toBe(11))
  })
  it('supports an empty pack list', () => {
    const empty = { ...pricing, packs: [] }
    const { result } = renderHook(() => useProductPricing(empty), { wrapper })
    expect(result.current.isPending).toBe(false)
    expect(result.current.data?.packs).toEqual([])
  })
  it('keeps server prices if background refresh fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/billing/pricing', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useProductPricing(pricing), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toEqual(pricing)
  })
})

describe('server community hydration', () => {
  it('renders server cards while auth and author metadata are still pending', () => {
    const { result } = renderHook(() => useCommunityContainer({ initialExams: [card] }), {
      wrapper,
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.results.find((item) => item.id === communityFixtureCard.id)?.title).toBe(
      communityFixtureCard.title,
    )
  })
  it('accepts an empty collection without a loading skeleton', () => {
    const { result } = renderHook(() => useCommunityContainer({ initialExams: [] }), { wrapper })
    expect(result.current.loading).toBe(false)
    expect(result.current.results.some((item) => item.mine)).toBe(false)
  })
  it('keeps server cards and reports a background refresh error', async () => {
    auth.pending = false
    server.use(
      http.get('http://localhost:3000/api/exams/community', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useCommunityContainer({ initialExams: [card] }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.openError).toBeTruthy())
    expect(result.current.loading).toBe(false)
    expect(result.current.results.some((item) => item.id === communityFixtureCard.id)).toBe(true)
  })
})
