import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { AdminContainer } from '@/modules/admin-pages'
export default function AdminStatsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="dashboard" />}>
      <AdminContainer section="stats" />
    </Suspense>
  )
}

export const metadata = { title: 'Quản trị – Thống kê' }
