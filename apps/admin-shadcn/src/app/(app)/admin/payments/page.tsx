import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { AdminContainer } from '@/modules/admin-pages'
export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="table" />}>
      <AdminContainer section="payments" />
    </Suspense>
  )
}

export const metadata = { title: 'Quản trị – Thanh toán' }
