import { afterEach, describe, expect, it, vi } from 'vitest'

import { site } from '@/config/site'
import { homeFaq } from '@/modules/public-pages/home-faq'
import {
  collectionJsonLd,
  faqJsonLd,
  pricingJsonLd,
  softwareJsonLd,
} from '@/modules/public-pages/public-page-json-ld'
import { publicPageMetadata, publicPages } from '@/modules/public-pages/public-page-seo'

afterEach(() => vi.unstubAllEnvs())

describe('public page metadata', () => {
  it.each(Object.keys(publicPages) as (keyof typeof publicPages)[])(
    'builds full metadata for %s',
    (key) => {
      vi.stubEnv('VERCEL_ENV', 'production')
      const page = publicPages[key]
      const metadata = publicPageMetadata(key)
      expect(metadata.alternates).toEqual({ canonical: new URL(page.path, site.url).href })
      expect(metadata.description?.length).toBeGreaterThan(130)
      expect(metadata.description?.length).toBeLessThan(180)
      expect(metadata.openGraph).toMatchObject({
        description: page.description,
        locale: 'vi_VN',
        type: 'website',
      })
      expect(metadata.twitter).toMatchObject({
        card: 'summary_large_image',
        description: page.description,
      })
      expect(metadata.robots).toMatchObject({ index: true, follow: true })
    },
  )
  it('uses an absolute homepage title and unique page titles', () => {
    expect(publicPageMetadata('home').title).toEqual({ absolute: publicPages.home.title })
    expect(new Set(Object.values(publicPages).map((page) => page.title)).size).toBe(5)
  })
  it('describes the free application and exactly matches the visible FAQ', () => {
    expect(softwareJsonLd()).toMatchObject({
      '@type': 'SoftwareApplication',
      'applicationCategory': 'EducationalApplication',
      'operatingSystem': 'Web',
      'offers': { price: 0, priceCurrency: 'VND' },
    })
    expect(faqJsonLd().mainEntity).toEqual(
      homeFaq.map((item) => ({
        '@type': 'Question',
        'name': item.question,
        'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
      })),
    )
  })
  it('omits unavailable pricing and supports empty collections', () => {
    expect(pricingJsonLd(null)).toBeNull()
    expect(collectionJsonLd([]).mainEntity).toMatchObject({ numberOfItems: 0, itemListElement: [] })
  })
  it('builds offers from the real pricing model', () => {
    expect(
      pricingJsonLd({
        pointsPer1000: 10,
        minVnd: 10_000,
        maxVnd: 1_000_000,
        defaultVnd: 50_000,
        packs: [{ vnd: 50_000, bonus: 10 }],
      }),
    ).toMatchObject({
      '@type': 'OfferCatalog',
      'itemListElement': [
        {
          '@type': 'Offer',
          'price': 50_000,
          'priceCurrency': 'VND',
          'itemOffered': { '@type': 'Product' },
        },
      ],
    })
  })
})
