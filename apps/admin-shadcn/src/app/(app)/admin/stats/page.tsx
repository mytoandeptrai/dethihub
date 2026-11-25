import { PageSkeleton } from '@/components/page-skeleton'
import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminStatsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="dashboard" />}>
      <AdminContainer section="stats" />
    </Suspense>
  )
}
