import { useRef, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/engine/components/ui/toggle-group'
import { useSlidingThumb } from '@/engine/examEditor/useSlidingThumb'
import { cn } from '@/engine/lib/cn'

/** Thanh chọn một trong vài mục (chữ + số đếm tuỳ chọn); thẻ trắng trượt tới mục đang chọn, cùng kiểu nút chuyển lưới/danh sách ở trang Cộng đồng. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: Array<{ key: T; label: string; count?: number; icon?: ReactNode }>
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-checked="true"]', value)
  return (
    <ToggleGroup
      ref={ref}
      type="single"
      value={`value:${value}`}
      onValueChange={(next) => {
        const option = options.find((o) => `value:${o.key}` === next)
        if (option) onChange(option.key)
      }}
      role="radiogroup"
      aria-label={label}
      className={cn(
        'bg-sunken relative inline-flex h-11 max-w-full items-center gap-0 overflow-x-auto rounded-[8px] p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {thumb ? (
        <span
          aria-hidden
          className="bg-surface shadow-soft absolute inset-y-[3px] left-0 rounded-[6px] transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      ) : null}
      {options.map((o) => {
        const active = value === o.key
        return (
          <ToggleGroupItem
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            value={`value:${o.key}`}
            onClick={() => {
              if (active) onChange(o.key)
            }}
            className={cn(
              'relative z-10 flex h-full shrink-0 items-center gap-2 rounded-[6px] px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-200 active:scale-[0.97] data-[state=on]:bg-transparent data-[state=on]:shadow-none sm:px-4',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined ? (
              <span className="tnum text-ink-4 text-[12px] font-medium">{o.count}</span>
            ) : null}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
