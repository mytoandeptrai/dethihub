'use client'

import { signOut } from '@engine-pricing'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useSession } from '@/hooks'

export function useMarketingContainer() {
  const pathname = usePathname()
  const { session: auth } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])
  const session = auth
    ? {
        user: {
          email: auth.user.email ?? '',
          name:
            typeof auth.user.user_metadata.display_name === 'string'
              ? auth.user.user_metadata.display_name
              : undefined,
          avatar:
            typeof auth.user.user_metadata.avatar_url === 'string'
              ? auth.user.user_metadata.avatar_url
              : undefined,
        },
      }
    : null
  const onSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
  }
  return {
    pathname,
    session,
    scrolled,
    menuOpen,
    menuAnim: { mounted: menuOpen, closing: false },
    canPay: true,
    feedbackOpen,
    onFeedbackChange: setFeedbackOpen,
    onFeedback: () => setFeedbackOpen(true),
    onMenuToggle: () => setMenuOpen((value) => !value),
    onSignOut,
  }
}
