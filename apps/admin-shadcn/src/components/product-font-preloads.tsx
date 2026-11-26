'use client'

import { preload } from 'react-dom'

export default function ProductFontPreloads() {
  for (const weight of [400, 600, 700]) {
    for (const subset of ['vietnamese', 'latin']) {
      preload(`/fonts/be-vietnam-pro-${subset}-${weight}-normal.woff2`, {
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      })
    }
  }
  return null
}
