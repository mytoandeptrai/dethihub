import { Suspense } from 'react'

import { PageSkeleton } from '@/components/page-skeleton'
import { JsonLd } from '@/components/seo/json-ld'
import { site } from '@/config/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import { ExamViewContainer } from '@/modules/student-exams'
import { PublicExamSummary } from '@/modules/student-exams/components/public-exam-summary'
import {
  isSampleExam,
  publicExamMetadata,
  quizJsonLd,
  requirePublicExam,
} from '@/modules/student-exams/public-exam'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return publicExamMetadata((await params).id)
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (isSampleExam(id))
    return (
      <Suspense fallback={<PageSkeleton variant="detail" />}>
        <ExamViewContainer />
      </Suspense>
    )
  const doc = await requirePublicExam(id)
  return (
    <>
      <JsonLd data={quizJsonLd(id, doc)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Trang chủ', url: site.url },
          { name: 'Đề cộng đồng', url: `${site.url}/community` },
          { name: doc.title, url: `${site.url}/exams/${id}` },
        ])}
      />
      <PublicExamSummary doc={doc} />
      <Suspense fallback={<PageSkeleton variant="detail" />}>
        <ExamViewContainer serverSummary initialDoc={doc} />
      </Suspense>
    </>
  )
}
