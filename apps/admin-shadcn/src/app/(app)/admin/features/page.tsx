import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { AdminContainer } from '@/modules/admin-pages'

export default function AdminFeaturesPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <AdminContainer section="features" />
    </Suspense>
  )
}

export const metadata = { title: 'Quản trị – Tính năng' }
