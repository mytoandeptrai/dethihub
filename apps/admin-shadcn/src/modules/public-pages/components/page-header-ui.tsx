'use client'
import { cn } from '@workspace/ui/lib/utils'

import type { ReactNode } from 'react'
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="page-shell"
      className={cn('mx-auto w-full max-w-[1180px] min-w-0 px-4 py-8 sm:px-6 lg:py-12', className)}
    >
      {children}
    </div>
  )
}
export function PageHeader({
  eyebrow,
  title,
  description,
  count,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  count?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-6 flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1 basis-64">
        {eyebrow && <div className="eyebrow text-ink-3 mb-2">{eyebrow}</div>}
        <h1 className="font-display text-ink text-2xl leading-tight font-semibold tracking-tight break-words sm:text-3xl">
          {title}
        </h1>
        {count !== null && count !== undefined && (
          <div className="text-ink-3 tnum mt-2 text-sm">{count}</div>
        )}
        {description && (
          <div className="text-ink-3 mt-2 max-w-2xl text-sm leading-relaxed">{description}</div>
        )}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
