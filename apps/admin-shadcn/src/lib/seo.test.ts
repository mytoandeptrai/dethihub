import { afterEach, describe, expect, it, vi } from 'vitest'

import { site } from '@/config/site'

import {
  breadcrumbJsonLd,
  buildMetadata,
  getRobots,
  organizationJsonLd,
  webSiteJsonLd,
} from './seo'

afterEach(() => vi.unstubAllEnvs())

describe('seo metadata', () => {
  it('builds complete canonical and social metadata without language alternates', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const result = buildMetadata({
      path: '/pricing',
      title: 'Bảng giá',
      description: 'Chi phí',
      image: { url: '/custom.png', alt: 'Custom' },
    })
    expect(result.alternates).toEqual({ canonical: `${site.url}/pricing` })
    expect(result.openGraph).toMatchObject({
      type: 'website',
      locale: 'vi_VN',
      siteName: site.name,
      title: `Bảng giá | ${site.name}`,
      description: 'Chi phí',
      images: [{ url: '/custom.png', alt: 'Custom' }],
    })
    expect(result.twitter).toMatchObject({ card: 'summary_large_image', images: ['/custom.png'] })
    expect(result.robots).toMatchObject({ index: true, follow: true })
  })
  it('provides defaults and article publication data', () => {
    expect(buildMetadata().description).toBe(site.description)
    expect(buildMetadata({ article: { publishedTime: '2025-01-01' } }).openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2025-01-01',
    })
  })
  it('never indexes private pages or non-production environments', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(getRobots(true)).toMatchObject({ index: false, follow: false })
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(getRobots()).toMatchObject({ index: false, follow: false })
  })
  it('links website data to the organization and orders breadcrumbs', () => {
    expect(organizationJsonLd()).not.toHaveProperty('sameAs')
    expect(organizationJsonLd()).not.toHaveProperty('contactPoint')
    expect(webSiteJsonLd().publisher['@id']).toBe(organizationJsonLd()['@id'])
    expect(breadcrumbJsonLd([{ name: 'Home', url: site.url }]).itemListElement[0]).toMatchObject({
      position: 1,
      item: site.url,
    })
  })
})
