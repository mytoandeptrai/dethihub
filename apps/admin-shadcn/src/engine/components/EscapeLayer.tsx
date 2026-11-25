import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

import { createEscapeLayerStack, type EscapeLayerEntry } from '@/engine/lib/escapeLayers'

const EscapeLayerContext = createContext<EscapeLayerEntry | null>(null)
let stack: ReturnType<typeof createEscapeLayerStack> | undefined

export function EscapeLayer({
  children,
  onClose,
  enabled = true,
}: {
  children: ReactNode
  onClose: () => void
  enabled?: boolean
}) {
  const parent = useContext(EscapeLayerContext)
  const [layer] = useState<EscapeLayerEntry>(() => ({ parent, onClose }))
  layer.parent = parent
  layer.onClose = onClose
  useLayoutEffect(() => {
    if (!enabled) return
    stack ??= createEscapeLayerStack(window)
    return stack.register(layer)
  }, [enabled, layer])
  return <EscapeLayerContext.Provider value={layer}>{children}</EscapeLayerContext.Provider>
}
