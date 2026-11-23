'use client'
import dynamic from 'next/dynamic'

import { useAdminContainer } from '@/modules/admin-pages/hooks/use-admin-container'

import type { AdminSection } from '@/modules/admin-pages/hooks/use-admin-container'
const AdminUi = dynamic(
  () => import('@/modules/admin-pages/components/admin-ui').then((module) => module.AdminUi),
  { ssr: false },
)
export function AdminContainer({ section }: { section: AdminSection }) {
  return <AdminUi {...useAdminContainer(section)} />
}
