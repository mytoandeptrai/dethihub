'use client'

import { t } from '@/i18n/translate'

import type { ReactNode } from 'react'

function PreviewValue({
  value,
  renderText,
}: {
  value: unknown
  renderText: (text: string) => ReactNode
}) {
  if (typeof value === 'string') return <>{renderText(value)}</>
  if (Array.isArray(value))
    return value.length ? (
      <ol className="border-line space-y-3 border-l pl-3">
        {value.map((item, index) => (
          <li key={index}>
            <PreviewValue value={item} renderText={renderText} />
          </li>
        ))}
      </ol>
    ) : (
      <span>{t('aiReview.empty')}</span>
    )
  if (value && typeof value === 'object')
    return (
      <dl className="space-y-2">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt className="text-ink-3 text-xs font-semibold">{key}</dt>
            <dd className="min-w-0 break-words">
              <PreviewValue value={item} renderText={renderText} />
            </dd>
          </div>
        ))}
      </dl>
    )
  return <>{value == null ? '—' : String(value)}</>
}

export function AiDocumentPreview({
  document,
  questionCount = 0,
  total,
  renderText = (text) => text,
}: {
  document: Record<string, unknown>
  questionCount?: number
  total?: number
  renderText?: (text: string) => ReactNode
}) {
  return (
    <section
      aria-label={t('aiReview.title')}
      className="border-line bg-surface my-3 min-w-0 rounded-xl border p-3 text-sm"
    >
      <h4 className="mb-3 font-semibold">{t('aiReview.title')}</h4>
      {questionCount > 0 ? (
        <p role="status" className="mb-3 font-semibold">
          {t('aiReview.count', { count: questionCount, total: total ? `/${total}` : '' })}
        </p>
      ) : null}
      <div className="max-h-96 overflow-y-auto">
        <PreviewValue value={document} renderText={renderText} />
      </div>
    </section>
  )
}
