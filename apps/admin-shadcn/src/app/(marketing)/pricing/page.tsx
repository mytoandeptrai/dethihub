import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { JsonLd } from '@/components/seo/json-ld'
import { PricingContainer } from '@/modules/public-pages'
import { getPublicPricing } from '@/modules/public-pages/public-page-data'
import { pricingJsonLd } from '@/modules/public-pages/public-page-json-ld'
import { publicPageMetadata } from '@/modules/public-pages/public-page-seo'

export const metadata = publicPageMetadata('pricing')
export default async function PricingPage() {
  const data = pricingJsonLd(await getPublicPricing())
  return (
    <>
      {data && <JsonLd data={data} />}
      <Suspense fallback={<PageSkeleton variant="cards" />}>
        <PricingContainer />
      </Suspense>
    </>
  )
}
