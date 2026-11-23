'use client'

import { dialog, useDialogs } from '@engine-dialogs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useMe } from '@/apis/me/queries'
import { submitPresence } from '@/apis/presence/requests'
import { useSite } from '@/apis/site/queries'
import { appPaths, safeRedirect } from '@/config/app-paths'
import { mapLegacyPath } from '@/config/legacy-paths'
import { useSession } from '@/hooks'

export function usePresenceHeartbeat(userId?: string) {
  useEffect(() => {
    if (!userId) return
    const tick = () => {
      if (document.visibilityState === 'visible') void submitPresence().catch(() => {})
    }
    tick()
    const timer = window.setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [userId])
}

export function useGlobalContainer() {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useSession()
  const site = useSite()
  const me = useMe()
  const staff = me.data?.role === 'admin' || me.data?.role === 'moderator'
  const maintenance = !!site.data?.maintenance.on
  const openPath = [
    appPaths.auth.login.href,
    appPaths.auth.forgot.href,
    appPaths.auth.reset.href,
    appPaths.auth.callback.href,
    appPaths.admin.href,
  ].some((path) => pathname.startsWith(path))
  const blocked = maintenance && !staff && !openPath
  const [dismissed, setDismissed] = useState(true)
  const [page, setPage] = useState(0)
  usePresenceHeartbeat(session?.user.id)
  useEffect(() => {
    if (pathname !== appPaths.editor.href || blocked)
      document.documentElement.dataset.productShell = ''
    else delete document.documentElement.dataset.productShell
    return () => {
      delete document.documentElement.dataset.productShell
    }
  }, [pathname, blocked])
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem('announcements-seen') === '1')
    } catch {
      setDismissed(false)
    }
  }, [])
  const announcements = (site.data?.announcements ?? [])
    .filter(
      (item) =>
        !item.until || (typeof item.until === 'string' && Date.parse(item.until) > Date.now()),
    )
    .slice(0, 5)
  const announcement =
    pathname === appPaths.home.href && !blocked && !dismissed ? announcements[page] : undefined
  const onDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('announcements-seen', '1')
    } catch {}
  }
  const onTry = () => {
    const path = safeRedirect(mapLegacyPath(announcement?.tryPath ?? appPaths.editor.href))
    onDismiss()
    router.push(path)
  }
  return {
    siteLoading: site.isPending,
    siteError: site.error?.message,
    blocked,
    maintenance,
    staff,
    message: site.data?.maintenance.message,
    announcement,
    page,
    count: announcements.length,
    onDismiss,
    onTry,
    onPrevious: () => setPage((value) => Math.max(0, value - 1)),
    onNext: () => setPage((value) => Math.min(announcements.length - 1, value + 1)),
  }
}

export function useGlobalDialogContainer() {
  const spec = useDialogs((state) => state.queue[0])
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue(spec?.defaultValue ?? '')
  }, [spec?.id, spec?.defaultValue])
  const close = (result: unknown) => {
    if (!spec) return
    useDialogs.setState((state) => ({ queue: state.queue.slice(1) }))
    spec.resolve(result as never)
  }
  return {
    spec,
    value,
    onValue: setValue,
    onCancel: () =>
      close(spec?.kind === 'confirm' ? false : spec?.kind === 'prompt' ? null : undefined),
    onAccept: () =>
      close(spec?.kind === 'confirm' ? true : spec?.kind === 'prompt' ? value : undefined),
    onAlt: () => close('alt'),
  }
}

export { dialog }
