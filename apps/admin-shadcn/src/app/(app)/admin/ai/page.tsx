import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { AdminContainer } from '@/modules/admin-pages'
export default function AdminAiPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <AdminContainer section="ai" />
    </Suspense>
  )
}
