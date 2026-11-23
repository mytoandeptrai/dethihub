import { Suspense } from 'react'

import { AdminContainer } from '@/modules/admin-pages'
export default function AdminAiPage() {
  return (
    <Suspense>
      <AdminContainer section="ai" />
    </Suspense>
  )
}
