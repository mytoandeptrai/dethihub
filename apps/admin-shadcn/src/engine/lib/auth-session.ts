import { getBrowserSupabase } from '@/lib/supabase/browser'

import type { Session as SupabaseSession } from '@supabase/supabase-js'

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email: string; name?: string; avatar?: string }
}

export const AUTH_EVENT = 'dethinhbien-auth'

let cached: Session | null = null

let listening = false

export function toEngineSession(session: SupabaseSession | null): Session | null {
  if (!session) return null
  const meta = session.user.user_metadata
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? 0,
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      name: meta.display_name || meta.full_name || meta.name,
      avatar: meta.avatar_url || meta.picture,
    },
  }
}

export function saveSession(session: SupabaseSession | null) {
  cached = toEngineSession(session)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function getSession(): Session | null {
  if (!listening && typeof window !== 'undefined') {
    listening = true
    getBrowserSupabase().auth.onAuthStateChange((_event, session) => saveSession(session))
  }
  return cached
}

export async function currentSession(
  _options: { keepOnError?: boolean } = {},
): Promise<Session | null> {
  getSession()
  const { data, error } = await getBrowserSupabase().auth.getSession()
  if (error) return null
  cached = toEngineSession(data.session)
  return cached
}

export const getCachedSession = (): Session | null => cached
