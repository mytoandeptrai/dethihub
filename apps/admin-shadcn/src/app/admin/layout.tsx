import { RequireStaff } from '@/components/require-staff'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireStaff>{children}</RequireStaff>
}
