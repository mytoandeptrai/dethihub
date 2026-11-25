'use client'
import { FooterUi, HeaderUi } from '@/modules/public-pages/components'
import { useMarketingContainer } from '@/modules/public-pages/hooks'

import type { ReactNode } from 'react'
export default function MarketingContainer({ children }: { children: ReactNode }) {
  const state = useMarketingContainer()
  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderUi {...state} />
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
      <FooterUi />
    </div>
  )
}
