import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminStatsPage() {
  return (
    <Suspense>
      <AdminContainer section="stats" />
    </Suspense>
  )
}
