'use client'

import { PageSkeleton } from '@/components/page-skeleton'
import { useRequireStaff } from '@/hooks/use-require-staff'

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireStaff()
  return isLoading ? <PageSkeleton variant="dashboard" /> : children
}
