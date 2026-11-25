import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { JsonLd } from '@/components/seo/json-ld'
import { site } from '@/config/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import { CommunityContainer } from '@/modules/community'
import { getPublicCollection } from '@/modules/public-pages/public-page-data'
import { collectionJsonLd } from '@/modules/public-pages/public-page-json-ld'
import { publicPageMetadata } from '@/modules/public-pages/public-page-seo'

export const metadata = publicPageMetadata('community')

export default async function CommunityPage() {
  const exams = await getPublicCollection()
  return (
    <>
      <JsonLd data={collectionJsonLd(exams)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Trang chủ', url: site.url },
          { name: 'Đề cộng đồng', url: `${site.url}/community` },
        ])}
      />
      <Suspense fallback={<PageSkeleton variant="cards" />}>
        <CommunityContainer initialExams={exams} />
      </Suspense>
    </>
  )
}
