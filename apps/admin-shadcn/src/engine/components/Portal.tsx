import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { EscapeLayer } from '@/engine/components/EscapeLayer'

export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function Portal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  const container = useContext(PortalContainerContext)
  const layer = useRef<HTMLDivElement>(null)
  const opener = useRef(document.activeElement as HTMLElement | null)
  const dismissible = Boolean(onClose)
  useEffect(() => {
    if (!dismissible) return
    layer.current
      ?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]')
      ?.focus()
    return () => {
      if (opener.current?.isConnected) opener.current.focus()
    }
  }, [dismissible])
  return createPortal(
    onClose ? (
      <EscapeLayer onClose={onClose}>
        <div ref={layer} data-portal-child className={container ? 'relative z-[210]' : undefined}>
          {children}
        </div>
      </EscapeLayer>
    ) : (
      children
    ),
    container ?? document.body,
  )
}
