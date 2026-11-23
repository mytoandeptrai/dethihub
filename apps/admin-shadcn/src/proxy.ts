import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import { appPaths, requiresAuth } from '@/config/app-paths'
import { env } from '@/config/env'

import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of values) response.cookies.set(name, value, options)
        },
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user && requiresAuth(request.nextUrl.pathname)) {
    const target = request.nextUrl.clone()
    target.pathname = appPaths.auth.login.href
    target.search = ''
    target.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search)
    const redirect = NextResponse.redirect(target)
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  }
  return response
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
}
