import { JsonLd } from '@/components/seo/json-ld'
import { buildMetadata, organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
import { HomeContainer } from '@/modules/public-pages'

export const metadata = buildMetadata()

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webSiteJsonLd()} />
      <HomeContainer />
    </>
  )
}
