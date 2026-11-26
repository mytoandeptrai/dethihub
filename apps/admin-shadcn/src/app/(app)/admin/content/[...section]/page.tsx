import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { AdminContainer } from '@/modules/admin-pages'
export default function AdminPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="table" />}>
      <AdminContainer section="content" />
    </Suspense>
  )
}

export const metadata = { title: 'Quản trị – Nội dung' }
