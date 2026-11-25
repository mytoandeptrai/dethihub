'use client'
import dynamic from 'next/dynamic'
import { PageSkeleton } from '@/components/page-skeleton'

import { useAdminContainer } from '@/modules/admin-pages/hooks/use-admin-container'

import type { AdminSection } from '@/modules/admin-pages/hooks/use-admin-container'
const AdminUi = dynamic(
  () => import('@/modules/admin-pages/components/admin-ui').then((module) => module.AdminUi),
  { ssr: false, loading: () => <PageSkeleton variant="dashboard" /> },
)
export function AdminContainer({ section }: { section: AdminSection }) {
  const props = useAdminContainer(section)
  return props.isPending ? <PageSkeleton variant={section === 'overview' || section === 'stats' ? 'dashboard' : section === 'ai' ? 'form' : 'table'} /> : <AdminUi {...props} />
}
