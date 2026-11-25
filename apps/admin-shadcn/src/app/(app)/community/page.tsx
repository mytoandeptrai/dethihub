import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { CommunityContainer } from '@/modules/community'

export default function CommunityPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="cards" />}>
      <CommunityContainer />
    </Suspense>
  )
}
