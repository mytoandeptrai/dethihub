import { Suspense } from 'react'

import { CommunityContainer } from '@/modules/community'

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityContainer />
    </Suspense>
  )
}
