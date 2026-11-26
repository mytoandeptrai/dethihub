import { useState } from 'react'
export function useDrawerExit(onClose: () => void) {
  const [closing, setClosing] = useState(false)
  const close = () => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 200)
  }
  return {
    close,
    backdropClass: closing ? 'backdrop-out' : 'backdrop-in',
    panelClass: closing ? 'drawer-out' : 'drawer-in',
  }
}
