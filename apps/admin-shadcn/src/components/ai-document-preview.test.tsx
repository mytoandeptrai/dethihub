import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AiDocumentPreview as PreparedPreview } from './ai-document-preview'
import { prepareAiApplication } from '@product-ui-engine'
import { draftPreviewFixture } from './ai-document-preview.test-fixture'
import type { ComponentProps } from 'react'

function AiDocumentPreview(props: Omit<ComponentProps<typeof PreparedPreview>, 'prepared'>) {
  return <PreparedPreview {...props} prepared={prepareAiApplication(props.document)} />
}

describe('document approval preview', () => {
  it.each([undefined, 'replace'])('warns about replacement for effective action %s and hides ignored patches', (action) => {
    render(<AiDocumentPreview document={{ action, blocks: [{ type: 'paragraph', text: 'Đề mới' }], patch: action ? [{ id: 'k0', block: { type: 'paragraph', text: 'Không áp dụng' } }] : [] }} />)
    expect(screen.getByText('Thay toàn bộ đề')).toBeVisible()
    expect(screen.queryByText('Không áp dụng')).not.toBeInTheDocument()
  })

  it('does not attach a multiple-choice answer to an independently numbered essay', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', no: 1, text: 'Trắc nghiệm', options: ['Một'] }, { type: 'essay', no: 1, text: 'Tự luận' }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }] }} />)
    const essay = screen.getByText('Tự luận').parentElement!.parentElement!
    expect(essay).not.toHaveTextContent('Đáp án')
  })

  it('does not display inline correctness that apply sanitization discards', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', text: 'Đề bài', answer: 'A', correctAnswer: 'A', options: [{ label: 'A', text: 'Một', correct: true, isCorrect: true }] }] }} />)
    expect(screen.queryByText('Đáp án đúng')).not.toBeInTheDocument()
    expect(screen.queryByText('Đáp án')).not.toBeInTheDocument()
  })

  it('previews valid question figures and omits invalid figures using apply validation', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', text: 'Có hình', figure: { kind: 'geo2d', shape: 'triangle' } }, { type: 'question', text: 'Không hình', figure: { kind: 'invalid' } }] }} />)
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
  })

  it('renders sanitized singular patch content and omits invalid patches', () => {
    render(<AiDocumentPreview document={{ patch: [{ id: 'k0', block: { type: 'paragraph', text: 'Nội dung sửa' } }, { id: 'invalid', block: { type: 'paragraph', text: 'Không áp dụng' } }] }} />)
    expect(screen.getByText('Nội dung sửa')).toBeVisible()
    expect(screen.queryByText('Không áp dụng')).not.toBeInTheDocument()
  })

  it('shows essay scores and preserved rubric labels', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'essay', score: 2.5, text: 'Chứng minh' }, { type: 'rubric', items: [{ label: 'Ý a (1 điểm)', text: 'Dựng hình' }] }] }} />)
    expect(screen.getByText('2.5 điểm')).toBeVisible()
    expect(screen.getByText('Ý a (1 điểm)')).toBeVisible()
  })
  it('renders a readable mini exam with both header columns and labelled answer options', () => {
    render(<AiDocumentPreview document={draftPreviewFixture} total={10} />)
    const region = screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
    for (const text of [
      'Thay toàn bộ đề',
      draftPreviewFixture.name,
      '2 câu hỏi · 5 khối khác',
      'TRƯỜNG THCS ĐỀ THI HUB',
      'ĐỀ ÔN TẬP TOÁN 9',
      'Họ và tên:',
      'Câu 1.',
      'Câu 2.',
      '6 cm',
      '7 cm',
      '8 cm',
      '10 cm',
      'Đường phân cách',
    ])
      expect(region).toHaveTextContent(text)
    expect(screen.getByRole('status')).toHaveTextContent('Đã soạn 2/10 câu')
    expect(within(region).getByText('A.')).toBeVisible()
    expect(within(region).getByText('D.')).toBeVisible()
    expect(within(region).getByText('Đáp án đúng')).toBeInTheDocument()
    expect(region).not.toHaveTextContent(/\b(type|label|blocks|replace|left|right)\b/)
  })

  it('counts only question blocks, including all question kinds, without exceeding the request', () => {
    render(
      <AiDocumentPreview
        document={{
          blocks: [
            { type: 'header' },
            ...['question', 'essay', 'tf', 'short'].map((kind) => ({
              type: kind === 'essay' ? 'essay' : 'question', kind,
              text: 'Đề bài',
            })),
            { type: 'paragraph' },
          ],
        }}
        total={2}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Đã soạn 4 câu')
    expect(screen.getByRole('status')).not.toHaveTextContent('/')
    expect(screen.getByText('4 câu hỏi · 2 khối khác')).toBeVisible()
  })

  it('previews patch operations and inserted blocks without dumping JSON keys', () => {
    render(
      <AiDocumentPreview
        document={{
          action: 'patch',
          patch: [
            { op: 'replace', id: 'k5', blocks: [{ type: 'heading', text: 'Hướng dẫn chấm' }] },
            { op: 'delete', id: 'k6' },
          ],
        }}
      />,
    )
    expect(screen.getByText('Sửa một phần')).toBeVisible()
    expect(screen.getByText('Thay khối · k5')).toBeVisible()
    expect(screen.getByText('Xoá khối · k6')).toBeVisible()
    expect(screen.getByText('Hướng dẫn chấm')).toBeVisible()
    expect(screen.getByRole('region')).not.toHaveTextContent(/\b(op|blocks|heading)\b/)
  })

  it('renders sanitized answer tables and delegates rich-text math rendering', () => {
    render(
      <AiDocumentPreview
        document={{
          action: 'append',
          blocks: [
            { type: 'answerKey', items: [{ no: 1, answer: '$x^2$' }] },
            { type: 'table', rows: [[{ text: 'Nội dung', header: true }], [{ text: '$x^2$' }], [{ text: 6 }]] },
          ],
        }}
        renderText={(text) => <span data-testid="math-renderer">{text}</span>}
      />,
    )
    expect(screen.getByText('Thêm vào cuối đề')).toBeVisible()
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.queryByRole('columnheader', { name: 'Nội dung' })).not.toBeInTheDocument()
    expect(screen.getByText('$x^2$')).toHaveAttribute('data-testid', 'math-renderer')
    expect(screen.queryByRole('cell', { name: '6' })).not.toBeInTheDocument()
  })

  it.each([
    {},
    { blocks: [] },
    { blocks: [null, 0, false, { type: 'futureType', secret: 'Do not dump this field' }] },
  ])('handles empty and unknown blocks without leaking raw fields', (document) => {
    render(<AiDocumentPreview document={document} />)
    expect(screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
    expect(screen.queryByText('Do not dump this field')).not.toBeInTheDocument()
  })
})
