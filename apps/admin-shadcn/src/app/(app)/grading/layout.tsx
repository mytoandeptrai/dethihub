import { getRobots } from '@/lib/seo'

import type { Metadata } from 'next'

export const metadata: Metadata = { robots: getRobots(true) }

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children
}
