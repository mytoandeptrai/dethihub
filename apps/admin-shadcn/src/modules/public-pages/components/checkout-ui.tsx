'use client'

import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import { Copy, LoaderCircle } from 'lucide-react'

import { t } from '@/i18n/translate'

import { Button } from './public-primitives-ui'

import type { useCheckoutContainer } from '@/modules/public-pages/hooks'

type CheckoutUiProps = ReturnType<typeof useCheckoutContainer>
const banks: Record<string, string> = {
  '970422': 'MB Bank',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970448': 'OCB',
  '970441': 'VIB',
  '970452': 'KienlongBank',
}

export default function CheckoutUi({
  order,
  expired,
  cells,
  copied,
  onCopy,
  close,
  mm,
  ss,
  error,
}: CheckoutUiProps) {
  const amount = order.vnd.toLocaleString('vi-VN')
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void close()
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="block w-full max-w-[25rem] overflow-hidden rounded-2xl p-0 md:max-w-[46rem]"
      >
        <div className="border-line bg-sunken/40 flex items-center justify-between gap-3 border-b px-5 py-4 md:px-7">
          <div>
            <DialogTitle className="text-ink text-[1.125rem] font-bold md:text-[1.375rem]">
              {t('product.checkout', { amount })}
            </DialogTitle>
            <p className="text-ink-3 text-sm">
              {t('product.points', { points: order.points.toLocaleString('vi-VN') })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('product.close')}
            onClick={() => void close()}
          >
            ×
          </Button>
        </div>
        <div className="md:grid md:grid-cols-[auto_1fr] md:items-center md:gap-7 md:px-7 md:pt-4 md:pb-7">
          <div className="px-5 pt-3 md:px-0 md:pt-0">
            <div className="border-line relative mx-auto aspect-square w-[13.5rem] max-w-full overflow-hidden rounded-[10px] border bg-white p-1.5 md:w-[18rem]">
              <svg
                viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`}
                className="size-full"
                shapeRendering="crispEdges"
                role="img"
                aria-label={t('product.qr')}
              >
                <rect x={-2} y={-2} width={cells.n + 4} height={cells.n + 4} fill="white" />
                <path d={cells.d} fill="currentColor" />
              </svg>
              {expired && (
                <div className="absolute inset-0 grid place-items-center bg-white/90 text-sm font-semibold">
                  {t('product.expired')}
                </div>
              )}
            </div>
            <p className="text-ink-3 mt-2.5 flex items-center justify-center gap-2 text-[13px]">
              {expired ? (
                t('product.newCode')
              ) : (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  {t('product.waiting')} · {mm}:{ss}
                </>
              )}
            </p>
          </div>
          <div className="divide-line divide-y px-5 py-5 md:px-0">
            {[
              [t('product.bankName'), banks[order.bin] ?? order.bin],
              [t('product.accountNumber'), order.accountNumber],
              [t('product.accountName'), order.accountName],
              [t('product.amount'), amount],
              [t('product.description'), order.description],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-ink-3 text-[13px]">{label}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-right text-sm font-semibold">
                  {value}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('product.copy')}
                    onClick={() => void onCopy(value ?? '')}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  {copied === value && (
                    <span role="status" className="sr-only">
                      {t('product.copied')}
                    </span>
                  )}
                </span>
              </div>
            ))}
            <p className="text-ink-3 pt-4 text-xs leading-relaxed">{t('product.transferNote')}</p>
            {error && (
              <p role="alert" className="pt-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
