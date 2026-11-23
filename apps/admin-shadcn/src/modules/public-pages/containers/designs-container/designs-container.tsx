'use client'
import { DesignsUi } from '@/modules/public-pages/components'
import { useDesignsContainer } from '@/modules/public-pages/hooks'
export default function DesignsContainer() {
  const state = useDesignsContainer()
  return <DesignsUi {...state} />
}
