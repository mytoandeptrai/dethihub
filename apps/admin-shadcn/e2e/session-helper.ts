import { chmod, readFile } from 'node:fs/promises'
import path from 'node:path'

import { createServerClient } from '@supabase/ssr'

import type { Browser } from '@playwright/test'

export async function signedInState(browser: Browser, origin: string) {
  const accountFile = process.env.E2E_ACCOUNT_FILE
  if (!accountFile) throw new Error('E2E_ACCOUNT_FILE is required')
  const account = JSON.parse(await readFile(accountFile, 'utf8')) as {
    email: string
    password: string
  }
  const env = Object.fromEntries(
    (await readFile('.env.local', 'utf8')).split('\n').flatMap((line) => {
      const match = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=(.*)$/)
      return match ? [[match[1]!, match[2]!.trim().replaceAll(/^['"]|['"]$/g, '')]] : []
    }),
  )
  const context = await browser.newContext()
  const client = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: async (cookies) => {
          await context.addCookies(
            cookies.map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
              url: origin,
              sameSite: 'Lax' as const,
            })),
          )
        },
      },
    },
  )
  const { data, error } = await client.auth.signInWithPassword(account)
  if (error || !data.session) {
    await context.close()
    throw new Error('Supabase test account sign-in failed')
  }
  const state =
    process.env.E2E_STORAGE_STATE ??
    path.join(path.dirname(accountFile), 'phase3b', 'storage-state.json')
  await context.storageState({ path: state })
  await chmod(state, 0o600)
  await context.close()
  return {
    state,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user,
  }
}
