import { appPaths, safeRedirect } from '@/config/app-paths'
import { getBrowserSupabase } from '@/lib/supabase/browser'

import { currentSession, getCachedSession, getSession, saveSession } from './auth-session'

import type { Session } from './auth-session'

export { AUTH_EVENT, currentSession, getSession, toEngineSession } from './auth-session'
export type { Session } from './auth-session'
export class AuthError extends Error {}
function check(error: { message: string } | null) {
  if (error) throw new AuthError(error.message)
}
export async function signIn(
  email: string,
  password: string,
  captchaToken?: string,
): Promise<Session> {
  const { data, error } = await getBrowserSupabase().auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  })
  check(error)
  saveSession(data.session)
  const session = getCachedSession()
  if (!session) throw new AuthError('Bạn cần đăng nhập lại.')
  return session
}
export async function signUp(
  email: string,
  password: string,
  name: string,
  captchaToken?: string,
): Promise<{ needsConfirm: boolean }> {
  const { data, error } = await getBrowserSupabase().auth.signUp({
    email,
    password,
    options: {
      captchaToken,
      data: { display_name: name },
      emailRedirectTo: window.location.origin + appPaths.auth.callback.href,
    },
  })
  check(error)
  if (data.user?.identities?.length === 0)
    throw new AuthError(
      'Email này đã có tài khoản (có thể đã đăng nhập bằng Google). Hãy đăng nhập thay vì đăng ký.',
    )
  saveSession(data.session)
  return { needsConfirm: !data.session }
}
export function signInWithGoogle(): void {
  const callback = new URL(appPaths.auth.callback.href, window.location.origin)
  callback.searchParams.set('next', takeReturnPath() ?? appPaths.editor.href)
  void getBrowserSupabase()
    .auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback.href } })
    .then(async ({ error }) => {
      if (error) (await import('@/engine/components/Dialog')).dialog.alert(error.message)
    })
}
let signingOut: Promise<void> | undefined
export function signOut(): Promise<void> {
  return (signingOut ??= finishSignOut().finally(() => {
    signingOut = undefined
  }))
}
async function finishSignOut(): Promise<void> {
  const session = await currentSession()
  const [
    { flushSync, stopSync },
    { useComposeStore },
    { pendingBoardSaves },
    { purgeUserData, DISCARD_USER_VIEW },
  ] = await Promise.all([
    import('@/engine/lib/sync'),
    import('@/engine/store/compose'),
    import('@/engine/store/boards'),
    import('@/engine/lib/localData'),
  ])
  const compose = useComposeStore.getState()
  if (session) {
    let ok = false
    try {
      for (const tab of compose.tabs) if (tab.dirty) compose.saveTab(tab.id)
      const flushed = await flushSync()
      ok = flushed.ok && !useComposeStore.getState().tabs.some((tab) => tab.dirty)
    } catch {}
    if (!ok) {
      const { dialog } = await import('@/engine/components/Dialog')
      if (
        !(await dialog.confirm(
          'Còn mục chưa đồng bộ lên tài khoản, đăng xuất sẽ xoá khỏi máy này. Vẫn đăng xuất?',
          { cancelLabel: 'Huỷ', confirmLabel: 'Vẫn đăng xuất', danger: true },
        ))
      )
        return
    }
  }
  const current = getSession()
  if (current && current.user.id !== session?.user.id) return
  stopSync()
  pendingBoardSaves.clear()
  useComposeStore.setState(useComposeStore.getInitialState(), true)
  window.dispatchEvent(new Event(DISCARD_USER_VIEW))
  const { error } = await getBrowserSupabase().auth.signOut()
  check(error)
  saveSession(null)
  await purgeUserData()
  window.location.reload()
}
export async function updateProfile(patch: { name?: string; avatar?: string }): Promise<void> {
  const data: Record<string, string> = {}
  if (patch.name !== undefined) data.display_name = patch.name
  if (patch.avatar !== undefined) data.avatar_url = patch.avatar
  check((await getBrowserSupabase().auth.updateUser({ data })).error)
}
export async function requestReset(email: string, captchaToken?: string): Promise<void> {
  const callback = new URL(appPaths.auth.callback.href, window.location.origin)
  callback.searchParams.set('next', appPaths.auth.reset.href)
  check(
    (
      await getBrowserSupabase().auth.resetPasswordForEmail(email, {
        captchaToken,
        redirectTo: callback.href,
      })
    ).error,
  )
}
export async function setNewPassword(_accessToken: string, password: string): Promise<void> {
  check((await getBrowserSupabase().auth.updateUser({ password })).error)
}
export async function consumeAuthRedirect(): Promise<'recovery' | 'session' | null> {
  return (await currentSession()) ? 'session' : null
}
const RETURN_KEY = 'dethinhbien-return'
export function rememberReturnPath(path: string): void {
  try {
    if (safeRedirect(path) === path) sessionStorage.setItem(RETURN_KEY, path)
  } catch {}
}
export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return path && safeRedirect(path) === path ? path : null
  } catch {
    return null
  }
}
