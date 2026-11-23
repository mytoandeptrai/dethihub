import { NextResponse } from 'next/server'

import { appPaths, safeRedirect } from '@/config/app-paths'
import { env } from '@/config/env'
import { getServerSupabase } from '@/lib/supabase/server'

export async function exchangeAuthCode(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await getServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error)
      return NextResponse.redirect(
        new URL(safeRedirect(url.searchParams.get('next')), env.NEXT_PUBLIC_APP_URL),
      )
  }
  return NextResponse.redirect(
    new URL(appPaths.auth.login.href + '?error=callback', env.NEXT_PUBLIC_APP_URL),
  )
}
