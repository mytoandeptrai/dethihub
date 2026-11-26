'use client'
import { LegalUi } from '@/modules/public-pages/components'
import { useLegalContainer } from '@/modules/public-pages/hooks'
export default function LegalContainer({ kind }: { kind: 'privacy' | 'terms' }) {
  const state = useLegalContainer(kind)
  return <LegalUi {...state} />
}
