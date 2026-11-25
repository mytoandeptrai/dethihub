import '@testing-library/jest-dom/vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { browserAuth } from '@/lib/api-client'
import { server } from '@/testing/msw/server'

import { AiPanel } from './AiPanel'

vi.mock('@/engine/lib/useSession', () => ({ useSession: () => null }))
vi.mock('@/engine/lib/khungPrompt', () => ({ khungPromptFor: async () => '' }))
vi.mock('@/engine/components/AiQuotaRing', () => ({ AiQuotaRing: () => null, TopupLink: () => null }))

beforeEach(() => {
  vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} })
  Element.prototype.scrollIntoView = vi.fn()
})

const reply = () => HttpResponse.json({ content: JSON.stringify({ blocks: [1, 2].map((no) => ({ type: 'question', no, text: `Question ${no}`, options: [] })) }), reasoning: '', usage: null, finishReason: 'stop', quota: null, receipt: 'receipt-1' })

describe('exam AI review workflow', () => {
  it.each(['replace', 'append'])('blocks truncated %s drafts and retries with the receipt', async (action) => {
    let calls = 0
    const retries: string[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', ({ request }) => {
      retries.push(request.headers.get('x-ai-retry-of') ?? '')
      calls++
      return HttpResponse.json({ content: calls === 1 ? `{"action":"${action}","blocks":[{"type":"question","text":"Partial question"}` : JSON.stringify({ action, blocks: [{ type: 'question', text: 'Complete question' }] }), receipt: `receipt-${calls}`, usage: null })
    }))
    const apply = vi.fn()
    render(<AiPanel onApplyBlocks={apply} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByText(/Phản hồi bị cắt/)
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chèn vào đề' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Soạn lại' }))
    await screen.findByRole('button', { name: 'Áp dụng' })
    expect(retries).toEqual(['', 'receipt-1'])
    expect(apply).not.toHaveBeenCalled()
  })

  it('blocks length-limited replies even when their JSON delimiters are complete', async () => {
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content: JSON.stringify({ action: 'replace', blocks: [{ type: 'paragraph', text: 'Partial draft' }] }), finishReason: 'length', usage: null })))
    render(<AiPanel onApplyBlocks={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByText(/Phản hồi bị cắt/)
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Soạn lại' })).toBeEnabled()
  })

  it.each([
    'Giải thích về JSON: {}. Không phải bản nháp.',
    'Ví dụ {"example":"value"}. Không phải bản nháp.',
    'Ví dụ {"blocks":"example","action":123}. Không phải bản nháp.',
  ])('keeps explanatory prose containing non-protocol JSON: %s', async (content) => {
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content, usage: null })))
    render(<AiPanel onApplyBlocks={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByText(content)
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Nội dung sẽ áp dụng' })).not.toBeInTheDocument()
  })

  it('recovers trailing commas and bare LaTeX before document approval', async () => {
    const content = String.raw`{"action":"append","say":"Bản nháp có dấu phẩy","blocks":[{"type":"paragraph","text":"$AH \\cdot CH$"},],}`.replaceAll('\\\\', '\\')
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content, usage: null })))
    const apply = vi.fn().mockReturnValue({ text: 'Đã áp dụng.' })
    const { container } = render(<AiPanel onApplyBlocks={apply} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByRole('button', { name: 'Áp dụng' })
    expect(container.textContent).not.toContain('"action"')
    expect(screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })).toHaveTextContent('paragraph')
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))
    expect(JSON.parse(apply.mock.calls[0]![0])).toEqual({ action: 'append', say: 'Bản nháp có dấu phẩy', blocks: [{ type: 'paragraph', text: String.raw`$AH \cdot CH$` }] })
  })

  it.each(['replace', 'append'])('previews every block applied by %s approval', async (action) => {
    const blocks = [{ type: 'heading', text: 'Tiêu đề sẽ chèn', level: 1 }, { type: 'paragraph', text: 'Lời giải sẽ chèn' }, { type: 'divider' }, { type: 'question', no: 1, text: 'Câu hỏi sẽ chèn' }, { type: 'answerKey', items: [{ no: 1, answer: 'Đáp án sẽ chèn' }] }, { type: 'table', rows: [['Ô sẽ chèn']] }]
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content: JSON.stringify({ action, say: 'Kiểm tra toàn bộ bản nháp', blocks }), usage: null })))
    const apply = vi.fn().mockReturnValue({ text: 'Đã áp dụng.' })
    render(<AiPanel onApplyBlocks={apply} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByRole('button', { name: 'Áp dụng' })
    const preview = screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
    for (const text of ['Tiêu đề sẽ chèn', 'Lời giải sẽ chèn', 'Câu hỏi sẽ chèn', 'Đáp án sẽ chèn', 'Ô sẽ chèn', 'divider']) expect(preview).toHaveTextContent(text)
    expect(apply).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))
    expect(JSON.parse(apply.mock.calls[0]![0]).blocks).toEqual(blocks)
  })

  it.each([true, false])('regenerates document approval with its retry receipt (questions: %s)', async (withQuestions) => {
    const retries: (string | null)[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', ({ request }) => {
      retries.push(request.headers.get('x-ai-retry-of'))
      return HttpResponse.json({ content: JSON.stringify({ action: 'append', say: 'Bản nháp kiểm tra', blocks: withQuestions ? [{ type: 'question', no: 1, text: 'Kiểm tra' }] : [{ type: 'paragraph', text: 'Lời giải' }] }), usage: null, receipt: `receipt-${retries.length}` })
    }))
    render(<AiPanel onApplyBlocks={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByRole('button', { name: 'Áp dụng' })
    const retry = screen.getByRole('button', { name: 'Soạn lại' })
    await waitFor(() => expect(retry).toBeEnabled())
    await userEvent.click(retry)
    await waitFor(() => expect(retries).toEqual(['', 'receipt-1']))
    await screen.findByRole('button', { name: 'Áp dụng' })
  })

  it('uses the public mascot asset in the thinking row', async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>
    server.use(http.post('http://localhost:3000/api/ai/chat', () => new HttpResponse(new ReadableStream({ start(controller) { stream = controller } }), { headers: { 'Content-Type': 'text/event-stream' } })))
    const { container } = render(<AiPanel onApplyBlocks={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề trắc nghiệm 20 câu môn Toán lớp 9 về hệ thức lượng, kèm đáp án.{Enter}')
    await waitFor(() => expect(stream).toBeDefined())
    act(() => stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'think', d: 'Đang suy nghĩ' })}\n\n`)))
    await screen.findByText('Suy nghĩ')
    const src = container.querySelector('.ai-step__mascot')?.getAttribute('src')
    await userEvent.click(screen.getByRole('button', { name: 'Dừng' }))
    expect(src).toBe('/brand/ai-static.svg')
  })

  it.each(['replace', 'append'])('reviews a recovered %s document reply with apply and cancel instead of raw JSON', async (action) => {
    const text = String.raw`$AH^2 = BH \cdot CH$, $\sqrt{2}$`
    const blocks = action === 'replace'
      ? [{ type: 'heading', text: 'ĐỀ TOÁN', level: 1 }, { type: 'question', no: 1, text, options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }]
      : [{ type: 'divider' }, { type: 'heading', text: 'LỜI GIẢI CHI TIẾT', level: 1 }, { type: 'paragraph', text }]
    const say = action === 'replace' ? 'Đề Toán đã sẵn sàng.' : 'Gửi thầy/cô lời giải chi tiết.'
    const content = JSON.stringify({ action, say, blocks }).replaceAll('\\\\', '\\')
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content, usage: null })))
    const apply = vi.fn().mockReturnValue({ text: 'Đã áp dụng.' })
    const { container } = render(<AiPanel contextSummary="Đã có đầu đề hai cột" documentDigest='{"blocks":[{"type":"header"}]}' onApplyBlocks={apply} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề trắc nghiệm 20 câu môn Toán lớp 9 về hệ thức lượng, kèm đáp án.{Enter}')
    await screen.findByText(say)
    expect(container.textContent).not.toContain('"action"')
    expect(screen.queryByRole('status')?.textContent).toBe(action === 'replace' ? 'Đã soạn 1/20 câu' : undefined)
    expect(screen.queryByRole('button', { name: 'Chèn vào đề' })).not.toBeInTheDocument()
    expect(apply).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))
    expect(JSON.parse(apply.mock.calls[0]![0])).toEqual({ action, say, blocks })
    expect(await screen.findByText('Đã áp dụng.')).toBeVisible()
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'tiếp tục{Enter}')
    await screen.findByRole('button', { name: 'Huỷ' })
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }))
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).not.toBeInTheDocument()
    expect(apply).toHaveBeenCalledOnce()
  })

  it('renders generated mathematical questions with the existing math renderer', async () => {
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content: JSON.stringify({ blocks: [{ type: 'question', text: 'Evaluate $x^2$.' }] }), usage: null })))
    const { container } = render(<AiPanel onApplyBlocks={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 1 câu Toán lớp 9{Enter}')
    await screen.findByLabelText('Chọn câu 1')
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('does not write until insert is clicked and inserts only the selected questions', async () => {
    server.use(http.post('http://localhost:3000/api/ai/chat', reply))
    const apply = vi.fn().mockReturnValue({ text: 'Đã chèn.' })
    render(<AiPanel onApplyBlocks={apply} />)
    await userEvent.type(screen.getByLabelText('Nhập yêu cầu cho AI'), 'Soạn đề 2 câu Toán lớp 9{Enter}')
    await screen.findByLabelText('Chọn câu 2')
    expect(apply).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chèn vào đề' })).toBeEnabled())
    await userEvent.click(screen.getByLabelText('Chọn câu 1'))
    await userEvent.click(screen.getByRole('button', { name: 'Chèn vào đề' }))
    expect(apply).toHaveBeenCalledTimes(1)
    expect(JSON.parse(apply.mock.calls[0]![0]).blocks).toEqual([{ type: 'question', no: 2, text: 'Question 2', options: [] }])
  })

  it('preserves queued messages in FIFO order after failure and offers exact manual retry', async () => {
    let fail!: () => void
    const gate = new Promise<void>((resolve) => { fail = resolve })
    const bodies: { messages: { content: string }[] }[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', async ({ request }) => {
      const body = await request.json() as typeof bodies[number]
      bodies.push(body)
      if (bodies.length === 1) {
        await gate
        return HttpResponse.json({ title: 'Bad Gateway', status: 502, detail: 'AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.' }, { status: 502 })
      }
      return reply()
    }))
    render(<AiPanel onApplyBlocks={vi.fn()} />)
    const input = screen.getByLabelText('Nhập yêu cầu cho AI')
    await userEvent.type(input, 'Soạn đề 2 câu Toán lớp 9{Enter}')
    await waitFor(() => expect(bodies).toHaveLength(1))
    await userEvent.type(input, 'Hi{Enter}Tiếp tục{Enter}')
    fail()
    await waitFor(() => expect(bodies).toHaveLength(3))
    expect(bodies.map((body) => body.messages.at(-1)?.content)).toEqual(['Soạn đề 2 câu Toán lớp 9', 'Hi', 'Tiếp tục'])
    const retry = await screen.findByRole('button', { name: 'Thử lại' })
    await waitFor(() => expect(retry).toBeEnabled())
    await userEvent.click(retry)
    await waitFor(() => expect(bodies).toHaveLength(4))
    expect(bodies[3]).toEqual(bodies[0])
  })
})
