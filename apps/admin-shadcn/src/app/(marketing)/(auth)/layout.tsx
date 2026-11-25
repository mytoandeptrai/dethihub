import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton variant="form" />}>{children}</Suspense>
}
