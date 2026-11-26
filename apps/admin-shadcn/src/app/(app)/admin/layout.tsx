import { RequireStaff } from '@/components/require-staff'
import { getRobots } from '@/lib/seo'

import type { Metadata } from 'next'

export const metadata: Metadata = { robots: getRobots(true) }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireStaff>{children}</RequireStaff>
}
