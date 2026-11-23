'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useMe } from '@/apis/me'
import { appPaths } from '@/config/app-paths'
import { useSession } from '@/hooks'
import { getBrowserSupabase } from '@/lib/supabase/browser'

export type FoundationMode = 'home' | 'profile' | 'uploads' | 'admin'

export function useFoundationContainer(mode: FoundationMode) {
  const t = useTranslations('common')
  const router = useRouter()
  const { session } = useSession()
  const me = useMe()
  const onSignOut = async () => {
    const { error } = await getBrowserSupabase().auth.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    router.replace(appPaths.home.href)
    router.refresh()
  }
  return {
    t,
    title: t(mode === 'home' ? 'welcome' : mode),
    isHome: mode === 'home',
    email: session?.user.email,
    isStaff: me.data?.role === 'admin' || me.data?.role === 'moderator',
    onSignOut,
  }
}
