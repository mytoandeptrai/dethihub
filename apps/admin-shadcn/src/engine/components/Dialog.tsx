import { useId, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { Button, inputClass } from '@/engine/components/ui'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/engine/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/engine/components/ui/alert-dialog'

/**
 * Hộp thoại thay alert / confirm / prompt của trình duyệt. Dùng như hàm bất đồng bộ:
 *   if (!(await dialog.confirm('Xoá đề này?', { title: 'Xoá đề', danger: true }))) return
 * `<DialogHost />` gắn một lần ở App; hộp mở cùng lúc được xếp hàng, không chồng lên nhau.
 */
interface Options {
  title?: string
  /** nhãn nút xác nhận (mặc định: Đồng ý / Đã hiểu / Lưu) */
  confirmLabel?: string
  cancelLabel?: string
  /** việc không hoàn tác được: nút xác nhận màu đất */
  danger?: boolean
  /** confirm: nút phụ giữa Huỷ và nút chính (vd "Bật, không hỏi lại"); bấm thì trả 'alt' */
  altLabel?: string
  /** chỉ prompt */
  label?: string
  defaultValue?: string
  placeholder?: string
}

type Spec = Options & { id: number; kind: 'alert' | 'confirm' | 'prompt' | 'content'; message: ReactNode; resolve: (v: never) => void }

export const useDialogs = create<{ queue: Spec[] }>(() => ({ queue: [] }))
let seq = 0

function open<T>(kind: Spec['kind'], message: ReactNode, o: Options = {}) {
  return new Promise<T>((resolve) => {
    const spec = { ...o, id: ++seq, kind, message, resolve: resolve as (v: never) => void }
    useDialogs.setState((s) => ({ queue: [...s.queue, spec] }))
  })
}

export const dialog = {
  show: (content: ReactNode, title: string) => open<void>('content', content, { title, confirmLabel: 'Đóng' }),
  alert: (message: string, o?: Options) => open<void>('alert', message, o),
  confirm: (message: string, o?: Options) => open<boolean>('confirm', message, o),
  /** confirm có nút phụ `altLabel`: trả true (nút chính), 'alt' (nút phụ) hoặc false (huỷ) */
  choose: (message: string, o: Options & { altLabel: string }) => open<boolean | 'alt'>('confirm', message, o),
  /** Trả chuỗi người dùng nhập, hoặc `null` khi huỷ. */
  prompt: (message: string, o?: Options) => open<string | null>('prompt', message, o),
}

export function DialogHost() {
  const spec = useDialogs((s) => s.queue[0])
  if (!spec) return null
  return <DialogView key={spec.id} spec={spec} />
}

function DialogView({ spec }: { spec: Spec }) {
  const { kind, title, message, danger } = spec
  const [value, setValue] = useState(spec.defaultValue ?? '')
  const box = useRef<HTMLDivElement>(null)
  const bodyId = useId()
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  const closed = useRef(false)

  const close = (result: unknown) => {
    if (closed.current) return
    closed.current = true
    useDialogs.setState((s) => ({ queue: s.queue.slice(1) }))
    spec.resolve(result as never)
  }
  const cancel = () => close(kind === 'confirm' ? false : kind === 'prompt' ? null : undefined)
  const accept = () => close(kind === 'confirm' ? true : kind === 'prompt' ? value : undefined)

  const confirmText = spec.confirmLabel ?? (kind === 'alert' ? 'Đã hiểu' : kind === 'prompt' ? 'Lưu' : 'Đồng ý')
  const Title = kind === 'alert' ? AlertDialogTitle : DialogTitle
  const Description = kind === 'alert' ? AlertDialogDescription : DialogDescription
  const contentProps = {
    ref: box,
    className: 'block max-w-[440px]',
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault()
      const first = kind === 'prompt' ? box.current?.querySelector('input') : box.current?.querySelector<HTMLElement>('[data-autofocus]')
      first?.focus()
      if (first instanceof HTMLInputElement) first.select()
    },
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault()
      opener?.focus()
    },
    onEscapeKeyDown: (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && kind === 'prompt' && !e.nativeEvent.isComposing) {
        e.preventDefault()
        accept()
      }
    },
    'aria-describedby': kind === 'content' ? undefined : bodyId,
  }

  const children = (
    <>
        <Title className={title ? 'text-[20px]' : 'sr-only'}>{title ?? (typeof message === 'string' ? message : confirmText)}</Title>
        <Description asChild id={bodyId}>
        <div
          className={`whitespace-pre-line break-words text-[14.5px] leading-relaxed text-ink-2 ${title ? 'mt-2' : ''}`}
        >
          {message}
        </div>
        </Description>

        {kind === 'prompt' ? (
          <label className="mt-5 block">
            {spec.label ? <span className="eyebrow mb-2 block">{spec.label}</span> : null}
            <input
              type="text"
              value={value}
              placeholder={spec.placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {kind === 'confirm' || kind === 'prompt' ? (
            <Button data-autofocus={danger ? '' : undefined} variant="soft" onClick={cancel}>
              {spec.cancelLabel ?? 'Huỷ'}
            </Button>
          ) : null}
          {kind === 'confirm' && spec.altLabel ? (
            <Button variant="soft" onClick={() => close('alt')}>
              {spec.altLabel}
            </Button>
          ) : null}
          <Button data-autofocus={danger ? undefined : ''} variant={danger ? 'clay' : 'primary'} onClick={accept}>
            {confirmText}
          </Button>
        </div>
    </>
  )

  if (kind === 'alert') return <AlertDialog open onOpenChange={(open) => { if (!open) cancel() }}><AlertDialogContent {...contentProps}>{children}</AlertDialogContent></AlertDialog>
  return <Dialog open onOpenChange={(open) => { if (!open) cancel() }}><DialogContent {...contentProps} showCloseButton={false}>{children}</DialogContent></Dialog>
}
