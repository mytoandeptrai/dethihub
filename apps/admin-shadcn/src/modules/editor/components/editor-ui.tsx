'use client'

import dynamic from 'next/dynamic'

const Engine = dynamic(() => import('@editor-engine'), { ssr: false })

export function EditorUI({ ready }: { ready: boolean }) {
  return <main id="main-content"><div id="root">{ready ? <Engine /> : null}</div></main>
}
