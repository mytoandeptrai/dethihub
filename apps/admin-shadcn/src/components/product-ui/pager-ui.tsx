'use client'
import { cn } from '@workspace/ui/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { t } from '@/i18n/translate'
function numbers(page: number, pages: number): { id: string; value: number | '…' }[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const out: { id: string; value: number | '…' }[] = []
  let prev = 0
  for (const n of [...set].toSorted((a, b) => a - b)) {
    if (n - prev > 1) out.push({ id: `gap-${n}`, value: '…' })
    out.push({ id: `page-${n}`, value: n })
    prev = n
  }
  return out
}
export function Pager({
  page,
  pages,
  go,
}: {
  page: number
  pages: number
  go: (p: number) => void
}) {
  if (pages <= 1) return null
  const btn =
    'flex h-9 min-w-9 items-center justify-center rounded-[6px] px-2 text-[13.5px] transition-colors disabled:opacity-35'
  return (
    <nav
      aria-label={t('workspaceCopy.m494')}
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        className={cn(btn, 'text-ink-2 hover:bg-paper-2')}
        disabled={page === 1}
        onClick={() => go(page - 1)}
        aria-label={t('workspaceCopy.m495')}
      >
        <ChevronLeft className="size-4" />
      </button>
      {numbers(page, pages).map(({ id, value: n }) =>
        n === '…' ? (
          <span key={id} className="text-ink-4 px-1">
            {t('workspaceCopy.m350')}
          </span>
        ) : (
          <button
            key={id}
            type="button"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => go(n)}
            className={cn(
              btn,
              n === page ? 'bg-ink font-semibold text-white' : 'text-ink-2 hover:bg-paper-2',
            )}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(btn, 'text-ink-2 hover:bg-paper-2')}
        disabled={page === pages}
        onClick={() => go(page + 1)}
        aria-label={t('workspaceCopy.m496')}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
