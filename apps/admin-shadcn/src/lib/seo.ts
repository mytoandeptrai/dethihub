import { site } from '@/config/site'

import type { Metadata } from 'next'

export function getRobots(noIndex = false) {
  const index = !noIndex && process.env.VERCEL_ENV === 'production'
  return {
    index,
    follow: index,
    googleBot: { index, 'follow': index, 'max-image-preview': 'large' as const },
  }
}

interface MetadataOptions {
  path?: string
  title?: string
  description?: string
  image?: { url: string; alt: string }
  article?: { publishedTime?: string }
  noIndex?: boolean
}

export function buildMetadata({
  path = '/',
  title,
  description = site.description,
  image,
  article,
  noIndex = false,
}: MetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${site.name}` : site.name
  const url = new URL(path, site.url).href
  return {
    title: title ?? { absolute: site.name },
    description,
    alternates: { canonical: url },
    robots: getRobots(noIndex),
    openGraph: {
      ...(article ? { type: 'article', ...article } : { type: 'website' }),
      title: fullTitle,
      description,
      url,
      locale: 'vi_VN',
      siteName: site.name,
      images: [image ?? { url: site.image, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image?.url ?? '/twitter-image'],
    },
  }
}

const organizationId = `${site.url}/#organization`
export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': organizationId,
  'name': site.name,
  'description': site.description,
  'url': site.url,
  'logo': `${site.url}/icons/icon-512.png`,
})
export const webSiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': site.name,
  'description': site.description,
  'url': site.url,
  'inLanguage': 'vi',
  'publisher': { '@id': organizationId },
})
export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url,
  })),
})
