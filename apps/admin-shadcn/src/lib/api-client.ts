import createClient from 'openapi-fetch'

import { appPaths } from '@/config/app-paths'
import { env } from '@/config/env'
import { createAuthenticatedFetch } from '@/lib/authenticated-fetch'
import { getBrowserSupabase } from '@/lib/supabase/browser'

import type { AccessTokenProvider } from '@/lib/authenticated-fetch'
import type { paths } from '@workspace/api-types'

export function createApiClient(auth: AccessTokenProvider) {
  return createClient<paths>({
    baseUrl: env.NEXT_PUBLIC_API_URL,
    fetch: createAuthenticatedFetch(auth),
  })
}

export const browserAuth: AccessTokenProvider = {
  getToken: async () =>
    (await getBrowserSupabase().auth.getSession()).data.session?.access_token ?? null,
  refreshToken: async () => {
    const { data, error } = await getBrowserSupabase().auth.refreshSession()
    return error ? null : (data.session?.access_token ?? null)
  },
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.location.assign(
        appPaths.auth.login.getHref(window.location.pathname + window.location.search),
      )
    }
  },
}

export const authenticatedFetch = createAuthenticatedFetch(browserAuth)
export const apiClient = createClient<paths>({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  fetch: authenticatedFetch,
})
