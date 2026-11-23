import { env } from '@/config/env'
import { authenticatedFetch } from '@/lib/api-client'

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const target = new URL(url, window.location.origin)
  if (target.origin !== window.location.origin && target.origin !== new URL(env.NEXT_PUBLIC_API_URL).origin) return fetch(url, init)
  if (!target.pathname.startsWith('/api/files/')) throw new Error('Unsupported engine API request: ' + target.pathname)
  return authenticatedFetch(new URL(target.pathname + target.search, env.NEXT_PUBLIC_API_URL), init)
}
