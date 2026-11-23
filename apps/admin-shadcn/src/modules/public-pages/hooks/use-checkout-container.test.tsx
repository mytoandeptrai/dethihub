import { dialog } from '@engine-dialogs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw/server'

import { useCheckoutContainer } from './use-checkout-container'

import type { PaymentOrder } from './use-pricing-container'
import type { ReactNode } from 'react'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const order: PaymentOrder = {
  orderCode: 123,
  vnd: 10_000,
  points: 275,
  checkoutUrl: '',
  qrCode: 'test-payment-qr',
  bin: '970422',
  accountNumber: '123',
  accountName: 'Teacher',
  description: 'PAY123',
  expiresAt: Math.floor(Date.now() / 1000) + 300,
}
const pending = {
  orderCode: order.orderCode,
  status: 'pending',
  vnd: order.vnd,
  points: order.points,
}
beforeEach(() => {
  vi.clearAllMocks()
  server.use(
    http.get('http://localhost:3000/api/billing/orders/123', () => HttpResponse.json(pending)),
  )
})
afterEach(() => vi.restoreAllMocks())

describe('checkout polling', () => {
  it('polls pending orders and notifies payment once', async () => {
    let count = 0
    server.use(
      http.get('http://localhost:3000/api/billing/orders/123', () =>
        HttpResponse.json({ ...pending, status: ++count > 1 ? 'paid' : 'pending' }),
      ),
    )
    const onPaid = vi.fn()
    const { result } = renderHook(() => useCheckoutContainer({ order, onClose: vi.fn(), onPaid }), {
      wrapper,
    })
    expect(result.current.cells.n).toBeGreaterThan(0)
    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(order.points), { timeout: 4500 })
    expect(onPaid).toHaveBeenCalledTimes(1)
  })
  it.each(['cancelled', 'paid'])(
    'honors the authoritative %s cancellation response',
    async (status) => {
      vi.spyOn(dialog, 'confirm').mockResolvedValue(true)
      server.use(
        http.post('http://localhost:3000/api/billing/orders/123/cancel', () =>
          HttpResponse.json({ ...pending, status }),
        ),
      )
      const onClose = vi.fn()
      const onPaid = vi.fn()
      const { result } = renderHook(() => useCheckoutContainer({ order, onClose, onPaid }), {
        wrapper,
      })
      await act(() => result.current.close())
      await waitFor(() => expect(status === 'paid' ? onPaid : onClose).toHaveBeenCalledTimes(1))
      expect(status === 'paid' ? onClose : onPaid).not.toHaveBeenCalled()
    },
  )
  it('keeps the order open and surfaces Problem Details when cancellation fails', async () => {
    vi.spyOn(dialog, 'confirm').mockResolvedValue(true)
    server.use(
      http.post('http://localhost:3000/api/billing/orders/123/cancel', () =>
        HttpResponse.json({ status: 409, detail: 'Không thể huỷ giao dịch này.' }, { status: 409 }),
      ),
    )
    const onClose = vi.fn()
    const { result } = renderHook(() => useCheckoutContainer({ order, onClose, onPaid: vi.fn() }), {
      wrapper,
    })
    await act(() => result.current.close())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Không thể huỷ giao dịch này.'))
    expect(onClose).not.toHaveBeenCalled()
  })
  it('handles expired orders and missing QR data without polling or cancellation', async () => {
    const confirm = vi.spyOn(dialog, 'confirm')
    const onClose = vi.fn()
    const { result } = renderHook(
      () =>
        useCheckoutContainer({
          order: { ...order, qrCode: '', expiresAt: 0 },
          onClose,
          onPaid: vi.fn(),
        }),
      { wrapper },
    )
    expect(result.current.expired).toBe(true)
    expect(result.current.cells).toEqual({ n: 0, d: '' })
    await act(() => result.current.close())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(confirm).not.toHaveBeenCalled()
  })
  it('exposes polling errors without pretending the order is paid', async () => {
    server.use(
      http.get('http://localhost:3000/api/billing/orders/123', () =>
        HttpResponse.json({ status: 503, detail: 'Chưa thể kiểm tra đơn.' }, { status: 503 }),
      ),
    )
    const onPaid = vi.fn()
    const { result } = renderHook(() => useCheckoutContainer({ order, onClose: vi.fn(), onPaid }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.error).toBe('Chưa thể kiểm tra đơn.'))
    expect(onPaid).not.toHaveBeenCalled()
  })
})
