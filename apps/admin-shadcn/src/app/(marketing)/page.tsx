import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { JsonLd } from '@/components/seo/json-ld'
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
import { HomeContainer } from '@/modules/public-pages'
import { faqJsonLd, softwareJsonLd } from '@/modules/public-pages/public-page-json-ld'
import { publicPageMetadata } from '@/modules/public-pages/public-page-seo'

export const metadata = publicPageMetadata('home')

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={softwareJsonLd()} />
      <JsonLd data={faqJsonLd()} />
      <Suspense fallback={<PageSkeleton variant="hero" />}>
        <HomeContainer />
      </Suspense>
    </>
  )
}
