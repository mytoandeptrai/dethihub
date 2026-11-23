import ComposeDoc from '@/engine/pages/ComposeDoc'
import { TooltipLayer } from '@/engine/components/Tooltip'
import { startSync } from '@/engine/lib/sync'
import { currentSession } from '@/engine/lib/auth'
import { useSession } from '@/engine/lib/useSession'
import { useEffect } from 'react'

export default function EditorRoot() {
  const userId = useSession()?.user.id
  useEffect(() => {
    if (!userId) return
    let disposed = false
    let stop: (() => void) | undefined
    void currentSession().then(() => disposed ? undefined : startSync())
      .then((fn) => { if (disposed) fn?.(); else stop = fn }).catch(() => {})
    return () => { disposed = true; stop?.() }
  }, [userId])
  return <><ComposeDoc /><TooltipLayer /></>
}
