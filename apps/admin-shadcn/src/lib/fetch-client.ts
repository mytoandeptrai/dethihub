import 'server-only'
import { redirect } from 'next/navigation'
import createClient from 'openapi-fetch'

import { appPaths } from '@/config/app-paths'
import { env } from '@/config/env'
import { createAuthenticatedFetch } from '@/lib/authenticated-fetch'
import { getServerSupabase } from '@/lib/supabase/server'

import type { paths } from '@workspace/api-types'

export async function getFetchClient() {
  const supabase = await getServerSupabase()
  return createClient<paths>({
    baseUrl: env.NEXT_PUBLIC_API_URL,
    fetch: createAuthenticatedFetch({
      getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
      refreshToken: async () => {
        const { data, error } = await supabase.auth.refreshSession()
        return error ? null : (data.session?.access_token ?? null)
      },
      onUnauthorized: () => redirect(appPaths.auth.login.href),
    }),
  })
}
