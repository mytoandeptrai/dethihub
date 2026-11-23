import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw/server'

import { useFeedbackContainer } from './use-feedback-container'

import type { ReactNode } from 'react'

vi.mock('@/hooks', () => ({ useSession: () => ({ session: null }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('feedback submission', () => {
  it('trims the message and optional email before posting and closes on success', async () => {
    let submitted: unknown
    server.use(
      http.post('http://localhost:3000/api/feedback', async ({ request }) => {
        submitted = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useFeedbackContainer({ open: true, onOpenChange }), {
      wrapper,
    })
    await act(async () => {
      await result.current
        .register('email')
        .onChange({ target: { name: 'email', value: ' teacher@example.com ' } })
      await result.current
        .register('message')
        .onChange({ target: { name: 'message', value: ' Xin bổ sung bài mẫu. ' } })
    })
    await act(() => result.current.onSubmit())
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(submitted).toEqual({
      email: 'teacher@example.com',
      message: 'Xin bổ sung bài mẫu.',
      page: '/',
    })
  })

  it('rejects an empty or whitespace-only message with Vietnamese validation', async () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useFeedbackContainer({ open: true, onOpenChange }), {
      wrapper,
    })
    await act(() =>
      result.current.register('message').onChange({ target: { name: 'message', value: '   ' } }),
    )
    await act(() => result.current.onSubmit())
    expect(result.current.errors.message?.message).toBe('Nhập nội dung phản hồi.')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('surfaces server Problem Details verbatim and keeps the form open', async () => {
    server.use(
      http.post('http://localhost:3000/api/feedback', () =>
        HttpResponse.json(
          { title: 'Unavailable', status: 503, detail: 'Phản hồi đang tạm khóa.' },
          { status: 503 },
        ),
      ),
    )
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useFeedbackContainer({ open: true, onOpenChange }), {
      wrapper,
    })
    await act(() =>
      result.current
        .register('message')
        .onChange({ target: { name: 'message', value: 'Nội dung phản hồi.' } }),
    )
    await act(() => result.current.onSubmit())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Phản hồi đang tạm khóa.'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
