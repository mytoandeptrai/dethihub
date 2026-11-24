import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
