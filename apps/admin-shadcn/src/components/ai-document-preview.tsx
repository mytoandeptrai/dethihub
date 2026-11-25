'use client'

import { t } from '@/i18n/translate'
import { isAiQuestionBlock, questionText } from '@/lib/ai-question-stream'

import type { ReactNode } from 'react'

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const contentText = (value: unknown) => typeof value === 'number' || typeof value === 'boolean' ? String(value) : questionText(value)
function keyed<T>(items: T[]) {
  const occurrences = new Map<string, number>()
  return items.map((value) => {
    const signature = JSON.stringify(value) ?? 'undefined'
    const occurrence = occurrences.get(signature) ?? 0
    occurrences.set(signature, occurrence + 1)
    return { value, key: `${signature}:${occurrence}` }
  })
}
const blockLabels = {
  divider: 'divider',
  pageBreak: 'pageBreak',
  toc: 'toc',
  image: 'image',
} as const
const patchLabels = {
  replace: 'replaceBlock',
  delete: 'deleteBlock',
  insertAfter: 'insertAfter',
  insertBefore: 'insertBefore',
} as const

function PaperTable({
  rows,
  renderText,
}: {
  rows: unknown[][]
  renderText: (text: string) => ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="my-2 w-full border-collapse text-left text-xs">
        <tbody>
          {keyed(rows).map(({ value: row, key }) => (
            <tr key={key}>
              {keyed(row).map(({ value: cell, key: cellKey }) => {
                const item = record(cell)
                const Cell = item.header ? 'th' : 'td'
                return (
                  <Cell
                    key={cellKey}
                    colSpan={typeof item.colSpan === 'number' ? item.colSpan : undefined}
                    rowSpan={typeof item.rowSpan === 'number' ? item.rowSpan : undefined}
                    className="border-line border px-2 py-1.5"
                  >
                    {renderText(contentText(item.text ?? cell))}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaperBlock({
  block,
  number,
  answer,
  renderText,
}: {
  block: Record<string, unknown>
  number: number
  answer?: unknown
  renderText: (text: string) => ReactNode
}) {
  const text = (value: unknown) => renderText(contentText(value))
  if (block.type === 'header')
    return (
      <div className="grid grid-cols-2 gap-3 border-b border-indigo-100 pb-3 text-center text-xs font-semibold whitespace-pre-line">
        <div>{text(block.left)}</div>
        <div>{text(block.right)}</div>
      </div>
    )
  if (block.type === 'title' || block.type === 'heading')
    return <div className="font-bold text-indigo-950 dark:text-indigo-100">{text(block.text)}</div>
  if (block.type === 'student' || block.type === 'meta')
    return (
      <div className="text-ink-3 text-xs">
        {block.type === 'meta'
          ? list(block.rows)
              .map((row) => list(row).map((item) => contentText(item)).join(': '))
              .join(' · ')
          : text(block.text)}
      </div>
    )
  if (isAiQuestionBlock(block)) {
    const correct = contentText(block.answer ?? block.correctAnswer ?? block.correct ?? answer)
    return (
      <div className="space-y-2">
        <div>
          <span className="font-semibold">
            {t('aiReview.question', { number: Number(block.no ?? block.number) || number })}{' '}
          </span>
          {text(block.text ?? block.prompt)}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {list(block.options ?? block.statements).map((option, index) => {
            const item = record(option)
            const label = String(item.label ?? item.key ?? 'ABCD'[index] ?? index + 1)
            const selected = item.correct === true || item.isCorrect === true || correct === label
            return (
              <div
                key={label}
                className={`flex items-start gap-1 rounded px-1 py-1 ${selected ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : ''}`}
              >
                <b>{label}.</b>
                <div className="min-w-0">{text(item.text ?? option)}</div>
                {selected ? (
                  <span className="ml-auto">
                    ✓<span className="sr-only">{t('aiReview.correct')}</span>
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
        {keyed(list(block.sub)).map(({ value: item, key }) => (
          <div key={key} className="pl-3">
            {text(item)}
          </div>
        ))}
        {correct ? (
          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {t('aiReview.answer')} {renderText(correct)}
          </div>
        ) : null}
      </div>
    )
  }
  if (block.type === 'paragraph') return <div>{text(block.text)}</div>
  if (block.type === 'bullets' || block.type === 'rubric')
    return (
      <div>
        {text(block.title)}
        <ul className="list-disc space-y-1 pl-4">
          {keyed(list(block.items)).map(({ value: item, key }) => (
            <li key={key}>{text(record(item).text ?? item)}</li>
          ))}
        </ul>
      </div>
    )
  if (block.type === 'grid' || block.type === 'columns')
    return (
      <div className="grid grid-cols-2 gap-3">
        {keyed(list(block.cells ?? block.cols)).map(({ value: item, key }) => (
          <div key={key}>{text(item)}</div>
        ))}
      </div>
    )
  if (block.type === 'answerKey')
    return (
      <PaperTable
        rows={[
          [
            { text: t('aiReview.questionColumn'), header: true },
            { text: t('aiReview.answer'), header: true },
          ],
          ...list(block.items).map((item) => [String(record(item).no ?? ''), record(item).answer]),
        ]}
        renderText={renderText}
      />
    )
  if (block.type === 'table')
    return <PaperTable rows={list(block.rows).map((row) => list(row))} renderText={renderText} />
  const label = blockLabels[block.type as keyof typeof blockLabels] ?? 'unknown'
  return (
    <span
      className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
    >
      {t(`aiReview.${label}`)}
      {block.type === 'image' && block.alt ? ` · ${questionText(block.alt)}` : ''}
    </span>
  )
}

export function AiDocumentPreview({
  document,
  total,
  renderText = (text) => text,
}: {
  document: Record<string, unknown>
  questionCount?: number
  total?: number
  renderText?: (text: string) => ReactNode
}) {
  const patches = list(document.patch).map((patch) => record(patch))
  const blocks = list(document.blocks).map((block) => record(block))
  const allBlocks = [...blocks, ...patches.flatMap((patch) => list(patch.blocks).map((block) => record(block)))]
  const questionCount = allBlocks.filter((block) => isAiQuestionBlock(block)).length
  const answers = allBlocks
    .filter((block) => block.type === 'answerKey')
    .flatMap((block) => list(block.items).map((item) => record(item)))
  const action =
    document.action === 'append'
      ? 'append'
      : document.action === 'patch' || patches.length > 0
        ? 'patch'
        : document.action === 'replace'
          ? 'replace'
          : 'draft'
  let questionNumber = 0
  const renderBlocks = (items: Record<string, unknown>[]) =>
    keyed(items).map(({ value: block, key }) => {
      if (isAiQuestionBlock(block)) questionNumber++
      return (
        <div key={key} className="min-w-0 break-words">
          <PaperBlock
            block={block}
            number={questionNumber}
            answer={answers.find((answer) => Number(answer.no) === Number(block.no))?.answer}
            renderText={renderText}
          />
        </div>
      )
    })
  return (
    <section
      aria-label={t('aiReview.title')}
      className="border-line bg-surface my-3 min-w-0 rounded-xl border p-3 text-sm"
    >
      <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">{t('aiReview.title')}</h4>
      <p className="mt-2 font-semibold">{t(`aiReview.${action}`)}</p>
      {typeof document.name === 'string' ? (
        <p className="mt-1 font-medium">{document.name}</p>
      ) : null}
      <p className="text-ink-3 my-2 text-xs">
        {t('aiReview.summary', {
          questions: questionCount,
          others: allBlocks.length - questionCount,
        })}
      </p>
      {questionCount > 0 ? (
        <p role="status" className="mb-3 font-semibold">
          {t('aiReview.count', {
            count: questionCount,
            total: total && Number.isFinite(total) && total >= questionCount ? `/${total}` : '',
          })}
        </p>
      ) : null}
      <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-lg border border-indigo-100 bg-white p-3 text-slate-800 dark:border-indigo-900 dark:bg-slate-950 dark:text-slate-100 [&_.katex-display]:overflow-x-auto [&_p]:my-0">
        {renderBlocks(blocks)}
        {keyed(patches).map(({ value: patch, key }) => (
          <div key={key} className="space-y-3 border-t border-indigo-100 pt-3">
            <p className="text-ink-3 text-xs font-medium">
              {t(`aiReview.${patchLabels[patch.op as keyof typeof patchLabels] ?? 'patch'}`)}
              {patch.id ? ` · ${String(patch.id)}` : ''}
            </p>
            {renderBlocks(list(patch.blocks).map((block) => record(block)))}
          </div>
        ))}
        {allBlocks.length === 0 && patches.length === 0 ? (
          <p className="text-ink-3">{t('aiReview.empty')}</p>
        ) : null}
      </div>
    </section>
  )
}
