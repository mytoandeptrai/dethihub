import ComposeDoc from '@/engine/pages/ComposeDoc'
import { DialogHost } from '@/engine/components/Dialog'
import { TooltipLayer } from '@/engine/components/Tooltip'
import { startSync } from '@/engine/lib/sync'
import { currentSession } from '@/engine/lib/auth'
import { useSession } from '@/engine/lib/useSession'
import { startPresence } from '@/engine/lib/presence'
import { useEffect } from 'react'

export default function EditorRoot() {
  const userId = useSession()?.user.id
  useEffect(() => {
    if (!userId) return
    let disposed = false
    let stop: (() => void) | undefined
    const stopPresence = startPresence()
    void currentSession().then(() => disposed ? undefined : startSync())
      .then((fn) => { if (disposed) fn?.(); else stop = fn }).catch(() => {})
    return () => { disposed = true; stop?.(); stopPresence() }
  }, [userId])
  return <><ComposeDoc /><DialogHost /><TooltipLayer /></>
}
