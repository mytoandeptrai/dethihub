'use client'

import { dialog } from '@engine-dialogs'
import { useMutation, useQuery } from '@tanstack/react-query'
import makeQrCode from 'qrcode-generator'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { billingGetOrderQuery } from '@/apis/billing/queries'
import { billingCancelOrder } from '@/apis/billing/requests'
import { t } from '@/i18n/translate'

import type { PaymentOrder } from './use-pricing-container'

export type CheckoutProps = {
  order: PaymentOrder
  onClose: () => void
  onPaid: (points: number) => void
}

export function useCheckoutContainer({ order, onClose, onPaid }: CheckoutProps) {
  const [now, setNow] = useState(Date.now)
  const [copied, setCopied] = useState('')
  const notified = useRef(false)
  const remaining = Math.max(0, order.expiresAt * 1000 - now)
  const status = useQuery({
    ...billingGetOrderQuery({ params: { path: { orderCode: order.orderCode } } }),
    enabled: remaining > 0,
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== 'pending' ? false : 3000,
    refetchIntervalInBackground: false,
  })
  const expired =
    remaining === 0 ||
    (!!status.data && status.data.status !== 'pending' && status.data.status !== 'paid')
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (status.data?.status === 'paid' && !notified.current) {
      notified.current = true
      onPaid(status.data.points)
    }
  }, [status.data, onPaid])
  const cancel = useMutation({
    mutationFn: () => billingCancelOrder({ params: { path: { orderCode: order.orderCode } } }),
    onSuccess: (value) => {
      if (value.status === 'paid') {
        if (!notified.current) {
          notified.current = true
          onPaid(value.points)
        }
      } else onClose()
    },
    onError: (error) => toast.error(error.message),
  })
  const close = async () => {
    if (cancel.isPending) return
    if (expired) {
      onClose()
      return
    }
    if (
      await dialog.confirm(t('product.stopBody'), {
        title: t('product.stopPayment'),
        confirmLabel: t('product.stopConfirm'),
        cancelLabel: t('product.waitConfirm'),
        danger: true,
      })
    )
      cancel.mutate()
  }
  const cells = useMemo(() => {
    if (!order.qrCode) return { n: 0, d: '' }
    const qr = makeQrCode(0, 'M')
    qr.addData(order.qrCode)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let row = 0; row < n; row++)
      for (let column = 0; column < n; column++)
        if (qr.isDark(row, column)) d += `M${column} ${row}h1v1h-1z`
    return { n, d }
  }, [order.qrCode])
  const onCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.requestError'))
    }
  }
  return {
    order,
    expired,
    cells,
    copied,
    onCopy,
    close,
    mm: String(Math.floor(remaining / 60_000)).padStart(2, '0'),
    ss: String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0'),
    error: status.error?.message,
  }
}
