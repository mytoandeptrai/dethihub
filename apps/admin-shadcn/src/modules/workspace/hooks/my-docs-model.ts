import { docStatus } from '@workspace-engine'

import type { Deck, ExamDoc, DocStatus } from '@workspace-engine'

export type LibraryItem = { kind: 'exam'; doc: ExamDoc } | { kind: 'slide'; doc: Deck }
export type SortKey = 'recent' | 'oldest' | 'name' | 'size'
export type DocFilters = {
  query: string
  status: DocStatus | 'all'
  subject: string
  grade: string
}

export function filterAndSort(
  items: LibraryItem[],
  filters: DocFilters,
  sort: SortKey,
): LibraryItem[] {
  const query = filters.query.trim().toLowerCase()
  return items
    .filter(
      ({ kind, doc }) =>
        (!query || doc.title.toLowerCase().includes(query)) &&
        (filters.status === 'all' || docStatus(doc.status) === filters.status) &&
        (kind === 'slide' ||
          ((!filters.subject || ('subject' in doc && doc.subject === filters.subject)) &&
            (!filters.grade || ('grade' in doc && doc.grade === filters.grade)))),
    )
    .toSorted((a, b) => {
      if (sort === 'name') return a.doc.title.localeCompare(b.doc.title, 'vi')
      if (sort === 'size') return itemSize(b) - itemSize(a)
      if (sort === 'oldest') return a.doc.updatedAt.localeCompare(b.doc.updatedAt)
      return b.doc.updatedAt.localeCompare(a.doc.updatedAt)
    })
}

function itemSize(item: LibraryItem): number {
  return item.kind === 'exam' ? item.doc.blocks.length : item.doc.slides.length
}

export function metadataOptions(docs: ExamDoc[], field: 'subject' | 'grade'): string[] {
  return [...new Set(docs.map((doc) => doc[field]).filter((value) => value.trim()))].toSorted(
    (a, b) => a.localeCompare(b, 'vi'),
  )
}

const relativeTime = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
export function relativeUpdatedAt(value: string, now = Date.now()): string {
  const delta = (Date.parse(value) - now) / 1000
  if (!Number.isFinite(delta)) return '—'
  for (const [unit, seconds] of [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ] as const) {
    if (Math.abs(delta) >= seconds || unit === 'second')
      return relativeTime.format(Math.trunc(delta / seconds), unit)
  }
  return '—'
}
