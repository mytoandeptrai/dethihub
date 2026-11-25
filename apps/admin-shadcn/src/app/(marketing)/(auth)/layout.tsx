import { PageSkeleton } from '@/components/page-skeleton'
import { Suspense } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton variant="form" />}>{children}</Suspense>
}
