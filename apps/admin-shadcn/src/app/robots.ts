import { site } from '@/config/site'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.VERCEL_ENV === 'production'
        ? {
            userAgent: '*',
            allow: '/',
            disallow: [
              '/admin',
              '/editor',
              '/my-docs',
              '/online-exams',
              '/library',
              '/profile',
              '/grading',
              '/play/',
              '/quiz/',
              '/auth/',
              '/forgot-password',
              '/reset-password',
              '/api/',
            ],
          }
        : { userAgent: '*', disallow: '/' },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
