'use client'
import { HomeUi } from '@/modules/public-pages/components/home-ui'
import { useHomeContainer } from '@/modules/public-pages/hooks/use-home-container'
export default function HomeContainer() {
  const state = useHomeContainer()
  return <HomeUi {...state} />
}
