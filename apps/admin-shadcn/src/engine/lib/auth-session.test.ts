import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@supabase/supabase-js'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))
vi.mock('@/lib/supabase/browser', () => ({ getBrowserSupabase: () => ({ auth }) }))

const session: Session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: 1000,
  token_type: 'bearer',
  user: {
    id: 'test-user',
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    email: 'teacher@example.com',
    app_metadata: {},
    user_metadata: { display_name: 'Teacher', avatar_url: '/avatar.png' },
  },
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
})

describe('engine session leaf', () => {
  it('keeps the public session helpers as the same functions', async () => {
    const leaf = await import('./auth-session')
    const publicAuth = await import('./auth')
    expect(publicAuth.getSession).toBe(leaf.getSession)
    expect(publicAuth.currentSession).toBe(leaf.currentSession)
    expect(publicAuth.toEngineSession).toBe(leaf.toEngineSession)
    expect(publicAuth.AUTH_EVENT).toBe(leaf.AUTH_EVENT)
  })

  it('reads the cache without registering a listener', async () => {
    const leaf = await import('./auth-session')
    expect(leaf.getCachedSession()).toBeNull()
    expect(auth.onAuthStateChange).not.toHaveBeenCalled()
    leaf.saveSession(session)
    expect(leaf.getCachedSession()).toEqual(leaf.toEngineSession(session))
    expect(auth.onAuthStateChange).not.toHaveBeenCalled()
  })

  it('registers once and propagates login and logout events', async () => {
    const leaf = await import('./auth-session')
    const changed = vi.fn()
    window.addEventListener(leaf.AUTH_EVENT, changed)
    try {
      expect(leaf.getSession()).toBeNull()
      expect(leaf.getSession()).toBeNull()
      expect(auth.onAuthStateChange).toHaveBeenCalledTimes(1)
      const listener = auth.onAuthStateChange.mock.calls[0]![0] as (
        event: string,
        value: Session | null,
      ) => void
      listener('SIGNED_IN', session)
      expect(leaf.getSession()?.user).toEqual({
        id: 'test-user', email: 'teacher@example.com', name: 'Teacher', avatar: '/avatar.png',
      })
      listener('SIGNED_OUT', null)
      expect(leaf.getSession()).toBeNull()
      expect(changed).toHaveBeenCalledTimes(2)
    } finally {
      window.removeEventListener(leaf.AUTH_EVENT, changed)
    }
  })

  it('refreshes a session and clears an empty response', async () => {
    const leaf = await import('./auth-session')
    auth.getSession.mockResolvedValueOnce({ data: { session }, error: null })
    expect(await leaf.currentSession()).toEqual(leaf.toEngineSession(session))
    expect(await leaf.currentSession()).toBeNull()
    expect(leaf.getCachedSession()).toBeNull()
    expect(leaf.toEngineSession(null)).toBeNull()
  })

  it('returns null on provider error without overwriting the cached session', async () => {
    const leaf = await import('./auth-session')
    leaf.saveSession(session)
    auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('offline') })
    expect(await leaf.currentSession({ keepOnError: true })).toBeNull()
    expect(leaf.getCachedSession()).toEqual(leaf.toEngineSession(session))
  })
})
