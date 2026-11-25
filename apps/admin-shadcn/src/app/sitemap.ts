import { env } from '@/config/env'
import { site } from '@/config/site'

import type { paths } from '@workspace/api-types'
import type { MetadataRoute } from 'next'

export const revalidate = 3600
type CommunityExams =
  paths['/api/exams/community']['get']['responses'][200]['content']['application/json']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: site.contentUpdatedAt, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${site.url}/pricing`,
      lastModified: site.contentUpdatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${site.url}/community`,
      lastModified: site.contentUpdatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${site.url}/terms`,
      lastModified: site.contentUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: site.contentUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
  try {
    // The public API caps results at 100 and has no pagination or updatedAt field.
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/exams/community?limit=100`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate },
    })
    if (!response.ok) return entries
    const exams: CommunityExams = await response.json()
    if (!Array.isArray(exams)) return entries
    for (const exam of exams) {
      if (!exam.listed || typeof exam.id !== 'string') continue
      const date = typeof exam.createdAt === 'string' ? new Date(exam.createdAt) : undefined
      entries.push({
        url: `${site.url}/exams/${encodeURIComponent(exam.id)}`,
        ...(date && !Number.isNaN(date.getTime()) ? { lastModified: date } : {}),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    return entries
  }
  return entries
}
