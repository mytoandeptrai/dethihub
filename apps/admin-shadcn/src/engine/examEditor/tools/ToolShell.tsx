import { X } from 'lucide-react'
/**
 * Khung modal chung của các công cụ: tiêu đề, cột nhập bên trái, xem trước bên
 * phải, chân có Huỷ / Chèn. Chặn sự kiện lan ra ngoài (modal có thể render qua
 * portal từ trong phần tử slide).
 */
import { useEffect, type ReactNode } from 'react'

import { Button } from '@/engine/components/ui'
import { cn } from '@/engine/lib/cn'
import { svgDataUrl } from '@/engine/lib/plot'

import type { ToolImage } from '@/engine/lib/toolSpec'

export function ToolShell({
  title,
  hint,
  inputs,
  preview,
  emptyText = 'Chưa có gì để xem trước.',
  submitLabel,
  canSubmit,
  onSubmit,
  onClose,
  inputsWidth = 340,
  maxWidth,
  renderPreview,
  extraActions,
}: {
  title: string
  hint?: string
  inputs: ReactNode
  preview: ToolImage | null
  emptyText?: string
  submitLabel: string
  canSubmit: boolean
  onSubmit: () => void
  onClose: () => void
  inputsWidth?: number
  maxWidth?: number | string
  /** thay ảnh xem trước mặc định (vd. khung bấm/kéo để dựng hình) */
  renderPreview?: (preview: ToolImage) => ReactNode
  extraActions?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="bg-ink/30 fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4"
      onMouseDown={(e) => {
        e.stopPropagation()
        onClose()
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'anim-pop bg-surface shadow-float flex h-full max-h-[100dvh] w-full flex-col overflow-hidden rounded-none md:h-[min(660px,92vh)] md:max-h-[92vh] md:rounded-[8px]',
          !maxWidth && 'max-w-[980px]',
        )}
        style={{
          maxWidth: maxWidth
            ? typeof maxWidth === 'number'
              ? `${maxWidth}px`
              : maxWidth
            : undefined,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-line flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
          <div className="min-w-0">
            <h2 className="text-ink text-[17px] font-semibold">{title}</h2>
            {hint && <p className="text-ink-3 mt-0.5 text-[12.5px]">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-ink-3 hover:bg-sunken hover:text-ink flex size-8 shrink-0 items-center justify-center rounded-[6px] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div
            className="border-line flex shrink-0 flex-col gap-5 p-5 md:w-[var(--inputs-w)] md:overflow-y-auto md:border-r"
            style={{ ['--inputs-w' as string]: `${inputsWidth}px` }}
          >
            {inputs}
          </div>
          <div
            className={cn(
              'bg-paper-2 flex h-[min(56vh,520px)] min-h-0 min-w-0 flex-1 p-4 md:h-auto',
              renderPreview && !preview
                ? 'flex-col items-stretch justify-start'
                : 'items-center justify-center',
            )}
          >
            {renderPreview ? (
              renderPreview(preview ?? ({} as ToolImage))
            ) : preview ? (
              <img
                src={svgDataUrl(preview.svg)}
                alt="Xem trước"
                className="border-line max-h-full max-w-full rounded-[4px] border bg-white object-contain"
              />
            ) : (
              <p className="text-ink-3 text-[13px]">{emptyText}</p>
            )}
          </div>
        </div>

        <div className="border-line bg-surface sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-3.5">
          <div className="flex items-center gap-2">{extraActions}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Huỷ
            </Button>
            <Button variant="clay" size="sm" disabled={!canSubmit} onClick={onSubmit}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const sectionTitle = 'mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3'

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="text-ink-2 mt-2 flex cursor-pointer items-center gap-2 text-[13.5px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-clay)]"
      />
      {children}
    </label>
  )
}
