'use client'

import dynamic from 'next/dynamic'
import { PageSkeleton } from '@/components/page-skeleton'

const Engine = dynamic(() => import('@editor-engine'), { ssr: false, loading: () => <PageSkeleton variant="editor" /> })

export function EditorUI({ ready }: { ready: boolean }) {
  return <main id="main-content"><div id="root">{ready ? <Engine /> : <PageSkeleton variant="editor" />}</div></main>
}
