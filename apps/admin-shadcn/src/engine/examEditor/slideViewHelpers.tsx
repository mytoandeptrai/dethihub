import { useState } from 'react'

import { renderMath } from '@/engine/lib/math'
import { hasRich } from '@/engine/lib/slideMath'

import type { ResolvedTheme } from '@/engine/lib/slideTheme'
import type { SlideElement } from '@/engine/store/docs'

/** Trạng thái ẩn/hiện của hiệu ứng bấm-chuột: mờ dần + trượt/phóng nhẹ (translate/scale tách khỏi transform xoay của phần tử). */
const HIDDEN_POSE: Record<NonNullable<SlideElement['anim']>, React.CSSProperties> = {
  fade: {},
  rise: { translate: '0 2.4cqw' },
  drop: { translate: '0 -2.4cqw' },
  left: { translate: '-6cqw 0' },
  right: { translate: '6cqw 0' },
  zoom: { scale: '0.8' },
  spin: { rotate: '-90deg', scale: '0.6' },
}

export const revealStyle = (
  shown: boolean,
  anim: SlideElement['anim'] = 'fade',
  ms = 450,
): React.CSSProperties => ({
  opacity: shown ? 1 : 0,
  ...(shown ? { translate: '0 0', scale: '1', rotate: '0deg' } : (HIDDEN_POSE[anim] ?? {})),
  transition: `opacity ${ms}ms ease, translate ${ms}ms cubic-bezier(.2,.8,.2,1), scale ${ms}ms cubic-bezier(.2,.8,.2,1), rotate ${ms}ms cubic-bezier(.2,.8,.2,1)`,
})

/**
 * Vẽ công thức trong slide. `\frac` → `\tfrac` (phân số cỡ chữ thường): phân số
 * cỡ display cao ~2,2em làm dòng chữ phình ra và bị `FitText` co nhỏ.
 */
export const slideMathHtml = (text: string): string =>
  renderMath(text.replace(/\\(d?)frac/g, '\\tfrac')).replace(
    /\*\*([\s\S]+?)\*\*/g,
    '<strong>$1</strong>',
  )

export function MathCell({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  if (hasRich(value) && !editing) {
    return (
      <span
        data-tip="Nhấp đúp để sửa công thức"
        onDoubleClick={() => setEditing(true)}
        dangerouslySetInnerHTML={{ __html: slideMathHtml(value) }}
      />
    )
  }
  return (
    <input
      autoFocus={editing}
      onBlur={() => setEditing(false)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none"
      style={{ color: 'inherit' }}
    />
  )
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const decorStyle = (theme: ResolvedTheme): React.CSSProperties =>
  ({
    '--slide-decor-ink': theme.fg,
    '--slide-decor-accent': theme.secondary,
  }) as React.CSSProperties
