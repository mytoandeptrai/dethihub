import '@testing-library/jest-dom/vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { browserAuth } from '@/lib/api-client'
import { server } from '@/testing/msw/server'
import { defaultMeta } from '@/engine/lib/onlineExam'
import { dialog } from '@/engine/components/Dialog'

import { OnlineAiBox } from './OnlineAiBox'

const question = (number: number) => ({ type: 'tu-luan', number, prompt: `Question ${number}` })
const reply = () => HttpResponse.json({ content: JSON.stringify({ questions: [question(1), question(2)] }), usage: null, receipt: 'receipt-online' })

describe('online AI review', () => {
  it('adds nothing before explicit selection and uses the latest add callback', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    server.use(http.post('http://localhost:3000/api/ai/chat', reply))
    const original = vi.fn(), latest = vi.fn()
    const { rerender } = render(<OnlineAiBox meta={defaultMeta()} questions={[]} onAdd={original} />)
    await userEvent.type(screen.getByLabelText('Nội dung cần AI soạn'), 'Soạn 2 câu{Enter}')
    await screen.findByLabelText('Chọn câu 2')
    expect(original).not.toHaveBeenCalled()
    rerender(<OnlineAiBox meta={defaultMeta()} questions={[]} onAdd={latest} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chèn vào đề' })).toBeEnabled())
    await userEvent.click(screen.getByLabelText('Chọn câu 1'))
    await userEvent.click(screen.getByRole('button', { name: 'Chèn vào đề' }))
    expect(latest).toHaveBeenCalledOnce()
    expect(latest.mock.calls[0]![0]).toMatchObject([{ prompt: 'Question 2' }])
    expect(original).not.toHaveBeenCalled()
  })

  it('shows inline failure without a modal and retries the identical request and receipt', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    const alert = vi.spyOn(dialog, 'alert')
    const calls: { body: unknown; receipt: string | null }[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', async ({ request }) => {
      calls.push({ body: await request.json(), receipt: request.headers.get('X-Ai-Retry-Of') })
      return calls.length === 1 ? reply() : HttpResponse.json({ title: 'Bad Gateway', status: 502, detail: 'AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.', refundedTokens: 2000 }, { status: 502 })
    }))
    render(<OnlineAiBox meta={defaultMeta()} questions={[]} onAdd={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nội dung cần AI soạn'), 'Soạn 2 câu{Enter}')
    const regenerate = await screen.findByRole('button', { name: 'Soạn lại' })
    await waitFor(() => expect(regenerate).toBeEnabled())
    await userEvent.click(regenerate)
    await screen.findByText('AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(calls).toHaveLength(3))
    expect(calls[1]?.receipt).toBe('receipt-online')
    expect(calls[2]).toEqual(calls[1])
    expect(screen.getByText('Đã hoàn 2 điểm')).toBeInTheDocument()
    expect(alert).not.toHaveBeenCalled()
  })

  it('locks only AI controls, lets the surrounding builder edit, and retains stopped questions', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    let stream!: ReadableStreamDefaultController<Uint8Array>
    server.use(http.post('http://localhost:3000/api/ai/chat', () => new HttpResponse(new ReadableStream({ start(controller) { stream = controller } }), { headers: { 'Content-Type': 'text/event-stream' } })))
    const { container } = render(<><input aria-label="Existing question" defaultValue="Original" /><OnlineAiBox meta={defaultMeta()} questions={[]} onAdd={vi.fn()} /></>)
    await userEvent.type(screen.getByLabelText('Nội dung cần AI soạn'), 'Soạn 20 câu{Enter}')
    await waitFor(() => expect(stream).toBeDefined())
    const thinkingSrc = container.querySelector('img.motion-reduce\\:hidden')?.getAttribute('src')
    expect(screen.getByLabelText('Nội dung cần AI soạn')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Thêm tệp nguồn' })).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Existing question'), ' edited')
    expect(screen.getByLabelText('Existing question')).toHaveValue('Original edited')
    act(() => stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'delta', c: '{"questions":[' + JSON.stringify(question(1)) + ',' })}\n\n`)))
    await screen.findByText('Đã soạn 1/20 câu')
    await userEvent.click(screen.getByRole('button', { name: 'Dừng' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chèn vào đề' })).toBeEnabled())
    expect(screen.getByLabelText('Chọn câu 1')).toBeChecked()
    expect(thinkingSrc).toBe('/brand/ai-static.svg')
  })

  it('keeps the no-questions message inline', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content: '{"message":"Bạn muốn soạn môn nào?","questions":[]}', usage: null })))
    render(<OnlineAiBox meta={defaultMeta()} questions={[]} onAdd={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nội dung cần AI soạn'), 'Soạn câu hỏi{Enter}')
    expect(await screen.findByText(/Bạn muốn soạn môn nào/)).toHaveAttribute('role', 'alert')
  })
})
