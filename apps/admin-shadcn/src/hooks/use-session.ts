'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getBrowserSupabase } from '@/lib/supabase/browser'

import type { Session } from '@supabase/supabase-js'

export function useSession() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<{ session: Session | null; isLoading: boolean }>({
    session: null,
    isLoading: true,
  })
  useEffect(() => {
    let active = true
    let changed = false
    const supabase = getBrowserSupabase()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      changed = true
      if (!active) return
      setState({ session, isLoading: false })
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') queryClient.clear()
    })
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && !changed) setState({ session: data.session, isLoading: false })
      })
      .catch(() => {
        if (active && !changed) setState({ session: null, isLoading: false })
      })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient])
  return state
}
