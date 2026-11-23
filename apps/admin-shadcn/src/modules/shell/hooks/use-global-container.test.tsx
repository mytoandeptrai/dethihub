import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw/server'

import { useGlobalContainer, usePresenceHeartbeat } from './use-global-container'

import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

const state = vi.hoisted(() => ({ path: '/', session: null as Session | null }))
vi.mock('@/hooks', () => ({ useSession: () => ({ session: state.session, isLoading: false }) }))
vi.mock('next/navigation', () => ({
  usePathname: () => state.path,
  useRouter: () => ({ push: vi.fn() }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const site = (on: boolean, announcements: unknown[] = []) => ({
  maintenance: { on, message: 'Bảo trì thử nghiệm', until: null },
  announcements,
})

beforeEach(() => {
  state.path = '/'
  state.session = null
  sessionStorage.clear()
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  server.use(http.post('http://localhost:3000/api/presence', () => HttpResponse.json({ ok: true })))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('maintenance and announcements', () => {
  it('blocks visitors during maintenance', async () => {
    server.use(
      http.get('http://localhost:3000/api/site/status', () => HttpResponse.json(site(true))),
    )
    const { result } = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(result.current.blocked).toBe(true))
    expect(result.current.message).toBe('Bảo trì thử nghiệm')
  })
  it.each(['admin', 'moderator'])('allows %s staff through the maintenance gate', async (role) => {
    state.session = { user: { id: 'staff' } } as Session
    server.use(
      http.get('http://localhost:3000/api/site/status', () => HttpResponse.json(site(true))),
      http.get('http://localhost:3000/api/me', () => HttpResponse.json({ role })),
    )
    const { result } = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(result.current.staff).toBe(true))
    expect(result.current.maintenance).toBe(true)
    expect(result.current.blocked).toBe(false)
  })
  it.each(['/login', '/forgot-password', '/reset-password', '/auth/callback', '/admin/users'])(
    'keeps %s open during maintenance',
    async (path) => {
      state.path = path
      server.use(
        http.get('http://localhost:3000/api/site/status', () => HttpResponse.json(site(true))),
      )
      const { result } = renderHook(useGlobalContainer, { wrapper })
      await waitFor(() => expect(result.current.maintenance).toBe(true))
      expect(result.current.blocked).toBe(false)
    },
  )
  it('dismisses announcements for the entire session', async () => {
    server.use(
      http.get('http://localhost:3000/api/site/status', () =>
        HttpResponse.json(
          site(false, [
            { id: 'news', title: 'Tin mới', text: '', image: '', tryPath: '', until: null },
          ]),
        ),
      ),
    )
    const first = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(first.result.current.announcement?.title).toBe('Tin mới'))
    act(() => first.result.current.onDismiss())
    expect(sessionStorage.getItem('announcements-seen')).toBe('1')
    first.unmount()
    const second = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(second.result.current.count).toBe(1))
    expect(second.result.current.announcement).toBeUndefined()
  })
  it('shows neither a gate nor a dialog when the site is open and announcements are empty', async () => {
    server.use(
      http.get('http://localhost:3000/api/site/status', () => HttpResponse.json(site(false))),
    )
    const { result } = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(result.current.siteLoading).toBe(false))
    expect(result.current.blocked).toBe(false)
    expect(result.current.announcement).toBeUndefined()
  })
  it('does not lock users out when the status service fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/site/status', () =>
        HttpResponse.json({ status: 503, detail: 'Tạm ngừng' }, { status: 503 }),
      ),
    )
    const { result } = renderHook(useGlobalContainer, { wrapper })
    await waitFor(() => expect(result.current.siteError).toBe('Tạm ngừng'))
    expect(result.current.blocked).toBe(false)
  })
})

describe('presence heartbeat', () => {
  it('does not post anonymously', () => {
    const interval = vi.spyOn(window, 'setInterval')
    renderHook(() => usePresenceHeartbeat())
    expect(interval).not.toHaveBeenCalled()
  })
  it('posts immediately and every 60 seconds, pauses while hidden, resumes on visibility, and cleans up', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    let requests = 0
    server.use(
      http.post('http://localhost:3000/api/presence', () => {
        requests++
        return HttpResponse.json({ ok: true })
      }),
    )
    const hook = renderHook(() => usePresenceHeartbeat('teacher'))
    await vi.waitFor(() => expect(requests).toBe(1))
    act(() => vi.advanceTimersByTime(60_000))
    await vi.waitFor(() => expect(requests).toBe(2))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(60_000)
    })
    expect(requests).toBe(2)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await vi.waitFor(() => expect(requests).toBe(3))
    hook.unmount()
    act(() => vi.advanceTimersByTime(60_000))
    expect(requests).toBe(3)
  })
  it('recovers after a failed heartbeat', async () => {
    let requests = 0
    server.use(
      http.post('http://localhost:3000/api/presence', () =>
        ++requests === 1
          ? HttpResponse.json({ detail: 'Tạm ngừng' }, { status: 503 })
          : HttpResponse.json({ ok: true }),
      ),
    )
    renderHook(() => usePresenceHeartbeat('teacher'))
    await waitFor(() => expect(requests).toBe(1))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await waitFor(() => expect(requests).toBe(2))
  })
})
