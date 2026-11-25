import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { PricingContainer } from '@/modules/public-pages'
export default function PricingPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="cards" />}>
      <PricingContainer />
    </Suspense>
  )
}
