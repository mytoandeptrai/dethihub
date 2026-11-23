import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminAuditPage() {
  return (
    <Suspense>
      <AdminContainer section="audit" />
    </Suspense>
  )
}
