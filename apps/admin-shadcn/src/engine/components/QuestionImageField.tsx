import { ImagePlus, PencilRuler, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { TrashIcon } from '@/engine/components/appIcons'
import { Portal } from '@/engine/components/Portal'
import { ToolModal } from '@/engine/examEditor/tools/ToolModal'
import { ToolsPanel } from '@/engine/examEditor/tools/ToolsPanel'
import { cn } from '@/engine/lib/cn'
import { svgToPng } from '@/engine/lib/plot'
import { parseToolJson, readToolDoc, type ToolImage } from '@/engine/lib/toolSpec'

import type { QuestionImage } from '@/engine/data/types'

const POSITIONS: Array<{ value: NonNullable<QuestionImage['position']>; label: string }> = [
  { value: 'top', label: 'Trên đề bài' },
  { value: 'bottom', label: 'Dưới đề bài' },
  { value: 'left', label: 'Bên trái' },
  { value: 'right', label: 'Bên phải' },
]

/** Chọn / đổi / xoá ảnh của câu hỏi, kèm vị trí và độ rộng. Dán ảnh (Ctrl+V) ở ô đề bài do trang xử lý. */
export function QuestionImageField({
  image,
  onChange,
  busy,
  error,
  pick,
}: {
  image: QuestionImage | undefined
  onChange: (image: QuestionImage | undefined) => void
  busy: boolean
  error: string | null
  /** chọn tệp từ máy */
  pick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const pos = image?.position ?? 'bottom'
  // 'pick': chọn công cụ; 'edit': mở lại công cụ của ảnh đang có
  const [tool, setTool] = useState<null | 'pick' | 'edit'>(null)
  const editing = image?.plot ? parseToolJson(image.plot) : null
  const applyTool = async (img: ToolImage) => {
    setTool(null)
    const src = await svgToPng(img.svg, img.width, img.height)
    const doc = readToolDoc(img.svg)
    onChange({
      ...(image ?? {}),
      src,
      plot: doc ? JSON.stringify(doc) : undefined,
      // ảnh mới: bề rộng theo cỡ hình (khung câu hỏi ~700px)
      width:
        image?.width ?? Math.min(100, Math.max(30, Math.round(((img.width / 700) * 100) / 5) * 5)),
    })
  }
  const toolBtn =
    'flex items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-2 px-4 py-3 text-[13px] font-semibold text-ink-3 transition-colors hover:bg-sunken/60 hover:text-ink disabled:opacity-50'
  return (
    <div className="mt-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) pick(f)
        }}
      />
      {image?.src ? (
        <div className="bg-sunken/70 rounded-[8px] p-3">
          <div className="flex items-center gap-3">
            <img
              src={image.src}
              alt=""
              className="h-16 w-24 rounded-[6px] bg-white object-contain"
            />
            <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="Vị trí ảnh">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={pos === p.value}
                  onClick={() => onChange({ ...image, position: p.value })}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                    pos === p.value ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink bg-white',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => setTool('edit')}
                className="text-ink-2 hover:text-clay flex h-9 items-center gap-1.5 rounded-[6px] bg-white px-3 text-[12.5px] font-semibold transition-colors"
              >
                <PencilRuler className="size-4" />
                Sửa hình
              </button>
            )}
            <button
              type="button"
              aria-label="Xoá ảnh"
              data-tip="Xoá ảnh"
              onClick={() => onChange(undefined)}
              className="text-ink-3 hover:bg-clay-soft hover:text-clay flex size-9 items-center justify-center rounded-[6px] transition-colors"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
          <label className="text-ink-3 mt-3 flex items-center gap-3 text-[12.5px]">
            Độ rộng
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={image.width ?? 60}
              onChange={(e) => onChange({ ...image, width: Number(e.target.value) })}
              className="accent-clay flex-1"
            />
            <span className="tnum text-ink-2 w-10 text-right font-semibold">
              {image.width ?? 60}%
            </span>
          </label>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={cn(toolBtn, 'flex-1')}
          >
            <ImagePlus className="size-4" />
            {busy ? 'Đang xử lý ảnh…' : 'Thêm ảnh (hoặc Ctrl+V vào ô đề bài)'}
          </button>
          <button type="button" disabled={busy} onClick={() => setTool('pick')} className={toolBtn}>
            <PencilRuler className="size-4" />
            Vẽ bằng công cụ
          </button>
        </div>
      )}
      {tool === 'edit' && editing && (
        <Portal onClose={() => setTool(null)}>
          <ToolModal
            kind={editing.kind}
            initial={editing.spec}
            submitLabel="Cập nhật hình"
            onClose={() => setTool(null)}
            onInsert={(img) => void applyTool(img)}
          />
        </Portal>
      )}
      {tool === 'pick' && (
        <Portal onClose={() => setTool(null)}>
          <div
            className="bg-ink/30 fixed inset-0 z-[110] flex items-center justify-center p-4"
            onMouseDown={() => setTool(null)}
          >
            <div
              role="dialog"
              aria-label="Chọn công cụ vẽ"
              className="anim-pop bg-surface shadow-float flex max-h-[85vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[8px]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="border-line flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-ink text-[15px] font-semibold">Vẽ bằng công cụ</h2>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setTool(null)}
                  className="text-ink-3 hover:bg-sunken hover:text-ink rounded p-1"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-3">
                <ToolsPanel onInsertPlot={(img) => void applyTool(img)} />
              </div>
            </div>
          </div>
        </Portal>
      )}
      {error ? <p className="text-clay mt-1.5 text-[12.5px] font-medium">{error}</p> : null}
    </div>
  )
}
