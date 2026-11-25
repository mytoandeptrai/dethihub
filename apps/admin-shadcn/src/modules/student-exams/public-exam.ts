import { notFound } from 'next/navigation'
import { cache } from 'react'

import { fetchPublicJson } from '@/apis/public-server'
import { site } from '@/config/site'
import { buildMetadata, organizationJsonLd } from '@/lib/seo'

import type { data_docTypes_ExamDoc as ExamDoc } from '@student-engine'

type RichText = Extract<ExamDoc['blocks'][number], { type: 'paragraph' }>['text']

const sampleIds = new Set([
  'ct-toan-9-2026',
  'ct-toan-12-2026',
  'ct-vatli-10-2026',
  'ct-hoahoc-8-2026',
  'ct-nguvan-9-2026',
  'ct-tienganh-8-2026',
  'ct-lichsu-8-2026',
  'ct-tinhoc-7-2026',
])

export const isSampleExam = (id: string) => sampleIds.has(id)
export const plainText = (value: RichText | undefined) =>
  (typeof value === 'string' ? value : (value?.map((span) => span.text).join('') ?? ''))
    .replaceAll(/\s+/g, ' ')
    .trim()

export const getPublicExam = cache(async (id: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const doc = await fetchPublicJson<ExamDoc>(`/api/exams/community/${id}`)
  if (!doc || !Array.isArray(doc.blocks) || !doc.title || ('listed' in doc && doc.listed === false))
    return null
  return doc
})

export async function requirePublicExam(id: string) {
  const doc = await getPublicExam(id)
  if (!doc) notFound()
  return doc
}

export function publicExamSummary(doc: ExamDoc) {
  const questions = doc.online
    ? doc.online.sections.flatMap((section) =>
        section.questions.map((question) => plainText(question.prompt)),
      )
    : doc.blocks.flatMap((block) =>
        block.type === 'question' || block.type === 'essay' ? [plainText(block.text)] : [],
      )
  const author = doc.online?.author || site.name
  const excerpt =
    doc.blocks
      .flatMap((block) => (block.type === 'paragraph' ? [plainText(block.text)] : []))
      .find(Boolean) ??
    questions[0] ??
    ''
  const description =
    `${doc.subject} · ${doc.grade} · ${questions.length} câu hỏi · ${author}. ${excerpt}`.slice(
      0,
      160,
    )
  return {
    title: doc.title,
    subject: doc.subject,
    grade: doc.grade,
    author,
    questions,
    description,
    createdAt: doc.createdAt,
  }
}

export async function publicExamMetadata(id: string) {
  if (isSampleExam(id))
    return buildMetadata({ path: `/exams/${id}`, title: 'Đề thi mẫu', noIndex: true })
  const doc = await requirePublicExam(id)
  const summary = publicExamSummary(doc)
  return buildMetadata({
    path: `/exams/${id}`,
    title: summary.title,
    description: summary.description,
    article: { publishedTime: doc.createdAt },
    image: { url: `/exams/${id}/opengraph-image`, alt: summary.title },
  })
}

export function quizJsonLd(id: string, doc: ExamDoc) {
  const summary = publicExamSummary(doc)
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': summary.title,
    'description': summary.description,
    'about': summary.subject,
    'educationalLevel': summary.grade,
    'additionalProperty': {
      '@type': 'PropertyValue',
      'name': 'numberOfQuestions',
      'value': summary.questions.length,
    },
    'author': doc.online?.author
      ? { '@type': 'Person', 'name': summary.author }
      : { '@id': organizationJsonLd()['@id'] },
    'datePublished': summary.createdAt,
    'inLanguage': 'vi',
    'isAccessibleForFree': true,
    'url': `${site.url}/exams/${id}`,
    'provider': { '@id': organizationJsonLd()['@id'] },
  }
}
