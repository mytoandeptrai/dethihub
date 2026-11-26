import { getRobots } from '@/lib/seo'

import type { Metadata } from 'next'

const follow = process.env.VERCEL_ENV === 'production'
export const metadata: Metadata = {
  robots: { ...getRobots(true), follow, googleBot: { index: false, follow } },
}

export default function UtilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
