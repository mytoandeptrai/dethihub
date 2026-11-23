import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/config/env'

export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values) cookieStore.set(name, value, options)
        } catch {
          // Server Components cannot write cookies; the proxy persists refreshed sessions.
        }
      },
    },
  })
}
