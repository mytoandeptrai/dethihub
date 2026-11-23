import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dialog } from '@/engine/components/Dialog'
import { rememberReturnPath, requestReset, signInWithGoogle } from '@/engine/lib/auth'

const sdk = vi.hoisted(() => ({ signInWithOAuth: vi.fn(), resetPasswordForEmail: vi.fn() }))
vi.mock('@/lib/supabase/browser', () => ({ getBrowserSupabase: () => ({ auth: sdk }) }))
vi.mock('@/engine/components/Dialog', () => ({ dialog: { alert: vi.fn() } }))

beforeEach(() => {
  sdk.signInWithOAuth.mockReset().mockResolvedValue({ error: null })
  sdk.resetPasswordForEmail.mockReset().mockResolvedValue({ error: null })
  vi.mocked(dialog.alert).mockClear()
})

describe('engine OAuth adapter', () => {
  it.each(['/editor?exam=one', undefined])('uses the PKCE callback next parameter for %s', (returnPath) => {
    if (returnPath) rememberReturnPath(returnPath)
    signInWithGoogle()
    expect(sdk.signInWithOAuth).toHaveBeenCalledOnce()
    const options = sdk.signInWithOAuth.mock.calls[0]?.[0]
    expect(options.provider).toBe('google')
    const callback = new URL(options.options.redirectTo)
    expect(callback.pathname).toBe('/auth/callback')
    expect(callback.searchParams.get('next')).toBe(returnPath ?? '/editor')
    expect(callback.searchParams.has('redirectTo')).toBe(false)
  })

  it('shows the SDK error verbatim without navigating', async () => {
    sdk.signInWithOAuth.mockResolvedValue({ error: { message: 'Không thể đăng nhập Google.' } })
    signInWithGoogle()
    await vi.waitFor(() => expect(dialog.alert).toHaveBeenCalledWith('Không thể đăng nhập Google.'))
  })

  it('returns recovery emails through the PKCE callback to reset-password', async () => {
    await requestReset('teacher@example.com')
    const options = sdk.resetPasswordForEmail.mock.calls[0]?.[1]
    const callback = new URL(options.redirectTo)
    expect(callback.pathname).toBe('/auth/callback')
    expect(callback.searchParams.get('next')).toBe('/reset-password')
  })
})
