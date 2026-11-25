export type EscapeLayerEntry = {
  parent: EscapeLayerEntry | null
  onClose: () => void
}

export function createEscapeLayerStack(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
) {
  const layers: EscapeLayerEntry[] = []
  const onKey = (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape' || event.defaultPrevented) return
    const top = layers.at(-1)
    if (!top) return
    event.preventDefault()
    event.stopImmediatePropagation()
    top.onClose()
  }
  return {
    register(layer: EscapeLayerEntry) {
      const descendant = layers.findIndex((entry) => {
        for (let parent = entry.parent; parent; parent = parent.parent) {
          if (parent === layer) return true
        }
        return false
      })
      if (!layers.length) target.addEventListener('keydown', onKey, true)
      if (descendant < 0) layers.push(layer)
      else layers.splice(descendant, 0, layer)
      return () => {
        const index = layers.indexOf(layer)
        if (index < 0) return
        layers.splice(index, 1)
        if (!layers.length) target.removeEventListener('keydown', onKey, true)
      }
    },
  }
}
