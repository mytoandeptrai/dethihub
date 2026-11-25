import { PageSkeleton } from '@/components/page-skeleton'
import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="table" />}>
      <AdminContainer section="payments" />
    </Suspense>
  )
}
