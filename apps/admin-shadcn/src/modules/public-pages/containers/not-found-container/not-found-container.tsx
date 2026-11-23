'use client'
import { NotFoundUi } from '@/modules/public-pages/components'
import { useNotFoundContainer } from '@/modules/public-pages/hooks'
export default function NotFoundContainer() {
  const state = useNotFoundContainer()
  return <NotFoundUi {...state} />
}
