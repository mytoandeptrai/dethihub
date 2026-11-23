import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminPaymentsPage() {
  return (
    <Suspense>
      <AdminContainer section="payments" />
    </Suspense>
  )
}
