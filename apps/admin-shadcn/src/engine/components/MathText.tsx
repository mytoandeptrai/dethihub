import { useMemo } from 'react'

import { cn } from '@/engine/lib/cn'
import { renderMath } from '@/engine/lib/math'

/**
 * Renders text that may contain `$...$` / `$$...$$` LaTeX.
 */
export function MathText({
  children,
  className,
  as: As = 'span',
  style,
}: {
  children: string
  className?: string
  as?: 'span' | 'div' | 'p'
  style?: React.CSSProperties
}) {
  const html = useMemo(() => renderMath(children), [children])
  return <As className={cn(className)} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}
