'use client'

import { useRequireStaff } from '@/hooks/use-require-staff'
import { PageSkeleton } from '@/components/page-skeleton'

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireStaff()
  return isLoading ? <PageSkeleton variant="dashboard" /> : children
}
