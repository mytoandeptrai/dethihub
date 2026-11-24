'use client'

import { useState } from 'react'

import { questionText } from '@/lib/ai-question-stream'

import type { GeneratedQuestion } from '@/lib/ai-question-stream'
import type { ReactNode } from 'react'

export function AiQuestionPreview({ questions, total, busy = false, inserted = false, refundedTokens, onInsert, onRegenerate, renderText = (text) => text }: {
  questions: readonly GeneratedQuestion[]
  total?: number
  busy?: boolean
  inserted?: boolean
  refundedTokens?: number
  onInsert: (questions: GeneratedQuestion[]) => void
  onRegenerate: () => void
  renderText?: (text: string) => ReactNode
}) {
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const selected = questions.filter((question) => !excluded.has(question.id))
  return (
    <section aria-label="Câu hỏi AI đã soạn" className="my-3 min-w-0 rounded-xl border border-line bg-surface p-3 text-sm">
      <p role="status" className="mb-3 font-semibold">Đã soạn {questions.length}{total ? `/${total}` : ''} câu</p>
      <ol className="max-h-96 space-y-3 overflow-y-auto">
        {questions.map((question) => (
          <li key={question.id} className="flex min-w-0 items-start gap-2 border-b border-line pb-3 last:border-0">
            <input type="checkbox" aria-label={`Chọn câu ${question.number}`} checked={!excluded.has(question.id)} disabled={inserted}
              onChange={() => setExcluded((current) => { const next = new Set(current); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next })}
              className="mt-1 size-4 shrink-0 accent-indigo-600" />
            <div className="min-w-0 flex-1 break-words">
              <span className="font-semibold">Câu {question.number}. </span>{renderText(question.prompt)}
              {Array.isArray(question.raw.options) ? question.raw.options.map((option: unknown, index) => {
                const item = typeof option === 'object' && option ? option as Record<string, unknown> : { text: option }
                const label = String(item.label ?? item.key ?? 'ABCD'[index])
                return <div key={label} className="mt-1 flex items-start gap-1 text-ink-3"><span className="shrink-0">{label}.</span>{renderText(questionText(item.text))}</div>
              }) : null}
              {question.raw.answer ? <div className="mt-1 font-medium">Đáp án: {renderText(questionText(question.raw.answer))}</div> : null}
            </div>
          </li>
        ))}
      </ol>
      {refundedTokens && refundedTokens > 0 ? <p className="mt-2 text-emerald-700">Đã hoàn {(refundedTokens / 1000).toLocaleString('vi-VN')} điểm</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy || inserted || selected.length === 0} onClick={() => onInsert(selected)} className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white disabled:opacity-40">{inserted ? 'Đã chèn vào đề' : 'Chèn vào đề'}</button>
        <button type="button" disabled={busy} onClick={onRegenerate} className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Soạn lại</button>
      </div>
    </section>
  )
}
