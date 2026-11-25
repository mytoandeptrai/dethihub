import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AiDocumentPreview } from './ai-document-preview'
import { draftPreviewFixture } from './ai-document-preview.test-fixture'

describe('document approval preview', () => {
  it('renders a readable mini exam with both header columns and labelled answer options', () => {
    render(<AiDocumentPreview document={draftPreviewFixture} total={10} />)
    const region = screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
    for (const text of [
      'Thay toàn bộ đề',
      draftPreviewFixture.name,
      '2 câu hỏi · 4 khối khác',
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
            ...['question', 'essay', 'truefalse', 'short'].map((type) => ({
              type,
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

  it('renders answer keys and rich-text table cells as tables and delegates math rendering', () => {
    render(
      <AiDocumentPreview
        document={{
          action: 'append',
          blocks: [
            { type: 'answerKey', items: [{ no: 1, answer: 'A' }] },
            { type: 'table', rows: [[{ text: 'Nội dung', header: true }], [{ text: '$x^2$' }], [{ text: 6 }]] },
          ],
        }}
        renderText={(text) => <span data-testid="math-renderer">{text}</span>}
      />,
    )
    expect(screen.getByText('Thêm vào cuối đề')).toBeVisible()
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getByRole('columnheader', { name: 'Nội dung' })).toBeVisible()
    expect(screen.getByText('$x^2$')).toHaveAttribute('data-testid', 'math-renderer')
    expect(screen.getByRole('cell', { name: '6' })).toBeVisible()
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
