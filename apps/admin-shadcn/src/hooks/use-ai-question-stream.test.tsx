import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { browserAuth } from '@/lib/api-client'
import { server } from '@/testing/msw/server'

import { useAiQuestionStream } from './use-ai-question-stream'
import type { AiQuestionRequest } from './use-ai-question-stream'

const request: AiQuestionRequest = { body: { task: 'soan-de', messages: [{ role: 'user', content: '20 câu' }] }, total: 20 }
const friendly = 'AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.'

describe('shared question generation', () => {
  it('retains complete questions when stopped before the response finishes', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    let stream: ReadableStreamDefaultController<Uint8Array>
    server.use(http.post('http://localhost:3000/api/ai/chat', () => new HttpResponse(new ReadableStream({ start(controller) { stream = controller } }), { headers: { 'Content-Type': 'text/event-stream' } })))
    const { result } = renderHook(() => useAiQuestionStream())
    let completion: ReturnType<typeof result.current.run>
    act(() => { completion = result.current.run(request) })
    await waitFor(() => expect(result.current.state.busy).toBe(true))
    await waitFor(() => expect(stream!).toBeDefined())
    act(() => stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'delta', c: '{"blocks":[{"type":"question","text":"Complete","options":[]},' })}\n\n`)))
    await waitFor(() => expect(result.current.state.questions).toHaveLength(1))
    act(() => result.current.stop())
    await act(async () => { await completion! })
    expect(result.current.state.stopped).toBe(true)
    expect(result.current.state.questions).toHaveLength(1)
  })

  it('does not auto-retry, and manual retry preserves the exact body and retry receipt', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    const calls: { body: unknown; receipt: string | null }[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', async ({ request: incoming }) => {
      calls.push({ body: await incoming.json(), receipt: incoming.headers.get('X-Ai-Retry-Of') })
      return HttpResponse.json({ title: 'Bad Gateway', status: 502, detail: friendly, code: 'AI_UNAVAILABLE' }, { status: 502 })
    }))
    const { result } = renderHook(() => useAiQuestionStream())
    await act(async () => { await result.current.run({ ...request, retryOf: 'previous-receipt' }).catch(() => {}) })
    expect(result.current.state.error).toBe(friendly)
    expect(calls).toHaveLength(1)
    await act(async () => { await result.current.retry().catch(() => {}) })
    expect(calls).toHaveLength(2)
    expect(calls[1]).toEqual(calls[0])
    expect(calls[1]?.receipt).toBe('previous-receipt')
    expect(result.current.state.refundedTokens).toBeUndefined()
  })

  it('reports an empty successful response as a retryable failure', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ content: '', usage: null })))
    const { result } = renderHook(() => useAiQuestionStream())
    await act(async () => { await result.current.run(request).catch(() => {}) })
    expect(result.current.state.error).toBe('AI không trả về nội dung. Vui lòng thử lại.')
    expect(result.current.state.questions).toEqual([])
  })

  it('retains only the explicit refund metadata from a failed HTTP response', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    server.use(http.post('http://localhost:3000/api/ai/chat', () => HttpResponse.json({ title: 'Bad Gateway', status: 502, detail: friendly, refundedTokens: 2000 }, { status: 502 })))
    const { result } = renderHook(() => useAiQuestionStream())
    await act(async () => { await result.current.run(request).catch(() => {}) })
    expect(result.current.state.refundedTokens).toBe(2000)
  })

  it('uses the completed response receipt when regenerating', async () => {
    vi.spyOn(browserAuth, 'getToken').mockResolvedValue(null)
    const receipts: (string | null)[] = []
    server.use(http.post('http://localhost:3000/api/ai/chat', ({ request: incoming }) => {
      receipts.push(incoming.headers.get('X-Ai-Retry-Of'))
      return HttpResponse.json({ content: 'Done', receipt: 'completed-receipt', usage: null })
    }))
    const { result } = renderHook(() => useAiQuestionStream())
    await act(async () => { await result.current.run(request) })
    await act(async () => { await result.current.retry() })
    expect(receipts).toEqual(['', 'completed-receipt'])
  })
})
