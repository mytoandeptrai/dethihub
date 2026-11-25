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
  it('renders a regenerated plotted question with only the generic missing-key warning', () => {
    const current = { type: 'doc', content: [
      { type: 'examQuestion', content: [{ type: 'examQuestionPrompt', content: [{ type: 'text', text: 'Đồ thị nào?' }, { type: 'image', attrs: { src: 'data:image/png;base64,AAAA', plot: '{"kind":"graph"}' } }] }] },
      { type: 'examAnswerKey', content: [{ type: 'table', content: ['1', 'A'].map((text) => ({ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }] })) }] },
    ] }
    const document = { patch: [{ id: 'k0', block: { type: 'question', text: 'Đồ thị nào?', figure: { kind: 'graph', curves: ['x^2'] }, options: ['Parabol'] } }] }
    render(<PreparedPreview document={document} prepared={prepareAiApplication(document, current)} />)
    expect(screen.getByRole('img', { name: 'Đồ thị hàm số' }).getAttribute('src')).toContain('data:image/svg+xml')
    expect(screen.queryByText('Đáp án đúng')).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Phản hồi chưa cập nhật bảng đáp án.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('thứ tự')
  })
  it('highlights the question own answer but uses only a generic missing-key warning', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', text: 'Đề bài', answer: 'B', options: ['Sai', 'Đúng'] }] }} />)
    expect(screen.getByText('B.').parentElement).toHaveTextContent('Đáp án đúng')
    expect(screen.getByRole('alert')).toHaveTextContent('Phản hồi chưa cập nhật bảng đáp án.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('thứ tự')
  })
  it('previews replacement blocks rather than a no-op when the optional patch array is empty', () => {
    render(<AiDocumentPreview document={{ patch: [], blocks: [{ type: 'paragraph', text: 'Nội dung thay thế' }] }} />)
    expect(screen.getByText('Thay toàn bộ đề')).toBeVisible()
    expect(screen.getByText('Nội dung thay thế')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('shows a patch no-op notice instead of a successful draft when all IDs are malformed', () => {
    render(<AiDocumentPreview document={{ say: 'Đã sửa xong.', patch: [{ id: 'invalid', block: { type: 'paragraph', text: 'Không được chèn' } }] }} />)
    expect(screen.getByText('Sửa một phần')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Không có thay đổi hợp lệ để áp dụng.')
    expect(screen.queryByText('Không được chèn')).not.toBeInTheDocument()
  })
  it('clearly reports that out-of-bounds patches have nothing to apply', () => {
    const document = { say: 'Đã sửa xong.', patch: [{ id: 'k99', block: { type: 'paragraph', text: 'Không được chèn' } }] }
    render(<PreparedPreview document={document} prepared={prepareAiApplication(document, { type: 'doc', content: [{ type: 'paragraph' }] })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Không có thay đổi hợp lệ để áp dụng.')
    expect(screen.queryByText('Không được chèn')).not.toBeInTheDocument()
  })
  it('renders adjacent rich spans as one Markdown flow instead of a minus-sign bullet', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'paragraph', text: [{ text: '$x^2$' }, { text: ' - 2' }] }] }} renderText={(text) => <p data-testid="inline-flow">{text}</p>} />)
    expect(screen.getAllByTestId('inline-flow')).toHaveLength(1)
    expect(screen.getByTestId('inline-flow')).toHaveTextContent('$x^2$ - 2')
  })
  it('numbers a patched question by its resulting position without inheriting its existing answer', () => {
    const current = { type: 'doc', content: [
      { type: 'examHeader' },
      ...[1, 2, 3, 4].map((no) => ({ type: 'examQuestion', attrs: { no }, content: [{ type: 'examQuestionPrompt', content: [{ type: 'text', text: `Câu cũ ${no}` }] }] })),
      { type: 'examAnswerKey', content: [{ type: 'table', content: ['4', 'D'].map((text) => ({ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }] })) }] },
    ] }
    const document = { action: 'patch', patch: [{ id: 'k4', block: { type: 'question', no: 4, text: 'Câu được sửa', options: ['Một', 'Hai', 'Ba', 'Bốn'] } }] }
    render(<PreparedPreview document={document} prepared={prepareAiApplication(document, current)} />)
    expect(screen.getByText('Câu 4.')).toBeVisible()
    expect(screen.queryByText('Đáp án đúng')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Phản hồi chưa cập nhật bảng đáp án.')
    expect(screen.queryByText('Câu 1.')).not.toBeInTheDocument()
  })

  it('omits out-of-bounds and repeated destructive patches with the same application order', () => {
    const document = { patch: [{ id: 'k0', block: { type: 'paragraph', text: 'Giữ lần đầu' } }, { id: 'k0', block: { type: 'paragraph', text: 'Bỏ lần hai' } }, { id: 'k0', op: 'delete' }, { id: 'k9', block: { type: 'paragraph', text: 'Ngoài đề' } }] }
    render(<PreparedPreview document={document} prepared={prepareAiApplication(document, { type: 'doc', content: [{ type: 'paragraph' }] })} />)
    expect(screen.getByText('Giữ lần đầu')).toBeVisible()
    expect(screen.queryByText('Bỏ lần hai')).not.toBeInTheDocument()
    expect(screen.queryByText('Ngoài đề')).not.toBeInTheDocument()
    expect(screen.queryByText('Xoá khối · k0')).not.toBeInTheDocument()
  })
  it.each([undefined, 'replace'])('warns about replacement for effective action %s and hides ignored patches', (action) => {
    render(<AiDocumentPreview document={{ action, blocks: [{ type: 'paragraph', text: 'Đề mới' }], ...(action ? { patch: [{ id: 'k0', block: { type: 'paragraph', text: 'Không áp dụng' } }] } : {}) }} />)
    expect(screen.getByText('Thay toàn bộ đề')).toBeVisible()
    expect(screen.queryByText('Không áp dụng')).not.toBeInTheDocument()
  })

  it('does not attach a multiple-choice answer to an independently numbered essay', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', no: 1, text: 'Trắc nghiệm', options: ['Một'] }, { type: 'essay', no: 1, text: 'Tự luận' }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }] }} />)
    const essay = screen.getByText('Tự luận').parentElement!.parentElement!
    expect(essay).not.toHaveTextContent('Đáp án')
  })

  it('does not infer answers from correctness flags other than the question answer field', () => {
    render(<AiDocumentPreview document={{ blocks: [{ type: 'question', text: 'Đề bài', correctAnswer: 'A', options: [{ label: 'A', text: 'Một', correct: true, isCorrect: true }] }] }} />)
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
