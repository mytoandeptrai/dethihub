import { Skeleton } from '@workspace/ui/components/skeleton'

import { t } from '@/i18n/translate'

import type { ReactNode } from 'react'

export function LoadingRegion({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('loading.label')}
      className={`min-w-0 motion-reduce:[&_[data-slot=skeleton]]:animate-none ${className}`}
    >
      <span className="sr-only">{t('loading.label')}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border-line bg-surface space-y-4 rounded-xl border p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="border-line bg-surface space-y-4 rounded-xl border p-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="border-line bg-surface max-w-2xl space-y-6 rounded-xl border p-6">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="border-line bg-surface space-y-4 rounded-xl border p-5">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
      <FormSkeleton />
    </div>
  )
}

export function TableRowsSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_row, row) => (
        <tr key={row} aria-busy="true">
          {Array.from({ length: columns }, (_col, col) => (
            <td key={col} className="border-line border-b px-4 py-5">
              {row === 0 && col === 0 ? (
                <span
                  role="status"
                  aria-busy="true"
                  aria-label={t('loading.label')}
                  className="sr-only"
                >
                  {t('loading.label')}
                </span>
              ) : null}
              <Skeleton
                aria-hidden="true"
                className="h-4 w-full min-w-8 motion-reduce:animate-none"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function TableSkeleton() {
  return (
    <div className="border-line bg-surface overflow-hidden rounded-xl border">
      <div className="border-line grid grid-cols-5 gap-5 border-b p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="border-line grid grid-cols-5 gap-5 border-b p-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function EditorShellSkeleton() {
  return (
    <div className="bg-sunken/40 flex min-h-[75vh] flex-col gap-4 p-4">
      <div className="border-line bg-surface flex gap-3 rounded-xl border p-4">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-16" />
        ))}
      </div>
      <div className="flex flex-1 gap-5">
        <div className="bg-surface hidden w-56 shrink-0 space-y-4 rounded-xl p-4 md:block">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="border-line bg-surface mx-auto min-h-96 w-full max-w-3xl space-y-6 rounded-lg border p-8">
          <Skeleton className="h-8 w-2/3" />
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export type SkeletonVariant =
  | 'cards'
  | 'table'
  | 'dashboard'
  | 'form'
  | 'detail'
  | 'editor'
  | 'hero'

export function PageSkeleton({ variant = 'cards' }: { variant?: SkeletonVariant }) {
  return (
    <LoadingRegion
      className={
        variant === 'editor'
          ? ''
          : 'mx-auto w-full max-w-[1180px] space-y-6 px-4 py-8 sm:px-6 sm:py-10'
      }
    >
      {variant === 'editor' ? (
        <EditorShellSkeleton />
      ) : (
        <>
          <HeaderSkeleton />
          <div className="mb-6 flex flex-wrap gap-3">
            <Skeleton className="h-10 w-60 max-w-full" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
          {variant === 'table' ? (
            <TableSkeleton />
          ) : variant === 'form' ? (
            <FormSkeleton />
          ) : variant === 'detail' ? (
            <DetailSkeleton />
          ) : variant === 'dashboard' ? (
            <div className="space-y-6">
              <StatCardsSkeleton />
              <Skeleton className="h-64 w-full" />
              <TableSkeleton />
            </div>
          ) : variant === 'hero' ? (
            <div className="space-y-8">
              <Skeleton className="h-48 w-full" />
              <CardGridSkeleton />
            </div>
          ) : (
            <CardGridSkeleton />
          )}
        </>
      )}
    </LoadingRegion>
  )
}
