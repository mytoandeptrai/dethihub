import { http, HttpResponse } from 'msw'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { generateMetadata } from '@/app/(marketing)/exams/[id]/page'
import { site } from '@/config/site'
import { PublicExamSummary } from '@/modules/student-exams/components/public-exam-summary'
import {
  getPublicExam,
  plainText,
  publicExamSummary,
  quizJsonLd,
} from '@/modules/student-exams/public-exam'
import fixture from '@/testing/fixtures/public-exam.json'
import { server } from '@/testing/msw/server'

import type { data_docTypes_ExamDoc as ExamDoc } from '@student-engine'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404')
  },
}))
vi.mock('@/modules/student-exams', () => ({ ExamViewContainer: () => null }))

const doc = fixture as ExamDoc
const endpoint = `http://localhost:3000/api/exams/community/${fixture.id}`
const props = { params: Promise.resolve({ id: fixture.id }) }

describe('public exam SEO', () => {
  it('builds article metadata from an unauthenticated public document', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        expect(request.headers.has('authorization')).toBe(false)
        return HttpResponse.json(doc)
      }),
    )
    const metadata = await generateMetadata(props)
    expect(metadata.title).toBe(doc.title)
    expect(metadata.description).toContain('Toán · Lớp 9 · 4 câu hỏi')
    expect(metadata.alternates).toEqual({ canonical: `${site.url}/exams/${doc.id}` })
    expect(metadata.openGraph).toMatchObject({ type: 'article', publishedTime: doc.createdAt })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: [`/exams/${doc.id}/opengraph-image`],
    })
  })
  it.each([404, 500])('handles unavailable documents (%s)', async (status) => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status })))
    await expect(generateMetadata(props)).rejects.toThrow('404')
  })
  it('rejects invalid UUIDs and unlisted documents', async () => {
    expect(await getPublicExam('invalid')).toBeNull()
    server.use(http.get(endpoint, () => HttpResponse.json({ ...doc, listed: false })))
    await expect(generateMetadata(props)).rejects.toThrow('404')
  })
  it('keeps bundled samples client-side with noindex metadata', async () => {
    expect(
      await generateMetadata({ params: Promise.resolve({ id: 'ct-toan-9-2026' }) }),
    ).toMatchObject({ title: 'Đề thi mẫu', robots: { index: false, follow: false } })
  })
  it('renders one h1, three plain-text stems and a matching Quiz', () => {
    const html = renderToStaticMarkup(<PublicExamSummary doc={doc} />)
    const root = document.createElement('div')
    root.innerHTML = html
    expect(root.querySelectorAll('h1')).toHaveLength(1)
    expect(root.querySelector('section')).toHaveClass('no-print')
    expect(root.querySelectorAll('ol li')).toHaveLength(3)
    expect(root.textContent).not.toContain('Chứng minh định lý')
    expect(quizJsonLd(doc.id, doc)).toMatchObject({
      '@type': 'Quiz',
      'name': doc.title,
      'inLanguage': 'vi',
      'isAccessibleForFree': true,
      'additionalProperty': { value: 4 },
      'provider': { '@id': `${site.url}/#organization` },
    })
  })
  it('handles empty documents and preserves mathematical comparisons in rich text', () => {
    expect(publicExamSummary({ ...doc, blocks: [] }).questions).toEqual([])
    expect(plainText([{ text: 'Câu hỏi', marks: [{ type: 'bold' }] }])).toBe('Câu hỏi')
    expect(plainText('Cho x < 2 và y > 3.')).toBe('Cho x < 2 và y > 3.')
  })
})
