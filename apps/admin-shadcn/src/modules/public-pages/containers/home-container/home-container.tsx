'use client'
import { HomeUi } from '@/modules/public-pages/components'
import { useHomeContainer } from '@/modules/public-pages/hooks'
export default function HomeContainer() {
  const state = useHomeContainer()
  return <HomeUi {...state} />
}
