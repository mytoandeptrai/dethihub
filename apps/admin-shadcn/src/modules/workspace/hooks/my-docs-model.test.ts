import { emptyDoc } from '@workspace-engine'
import { describe, expect, it } from 'vitest'

import { filterAndSort, metadataOptions, relativeUpdatedAt } from './my-docs-model'

import type { LibraryItem } from './my-docs-model'
import type { DocStatus } from '@workspace-engine'

const item = (
  id: string,
  title: string,
  status: DocStatus = 'draft',
  subject = 'Toán',
): Extract<LibraryItem, { kind: 'exam' }> => ({
  kind: 'exam',
  doc: emptyDoc({ id, title, status, subject, grade: '9', updatedAt: `2026-01-0${id}T00:00:00Z` }),
})
const filters = { query: '', status: 'all', subject: '', grade: '' } as const

describe('workspace document filters', () => {
  it('combines search, status, subject and grade without mutating the store array', () => {
    const rows = [
      item('1', 'Đại số'),
      item('2', 'Hình học', 'published'),
      item('3', 'Vật lí', 'archived', 'Vật lí'),
    ]
    expect(
      filterAndSort(
        rows,
        { ...filters, query: ' HÌNH ', status: 'published', subject: 'Toán', grade: '9' },
        'recent',
      ).map((row) => row.doc.id),
    ).toEqual(['2'])
    expect(filterAndSort(rows, filters, 'recent').map((row) => row.doc.id)).toEqual(['3', '2', '1'])
    expect(rows.map((row) => row.doc.id)).toEqual(['1', '2', '3'])
  })

  it('handles empty lists and unmatched filters', () => {
    expect(filterAndSort([], filters, 'name')).toEqual([])
    expect(
      filterAndSort([item('1', 'Toán')], { ...filters, status: 'archived' }, 'oldest'),
    ).toEqual([])
    expect(metadataOptions([], 'subject')).toEqual([])
  })

  it('deduplicates metadata and handles invalid timestamps safely', () => {
    const rows = [item('1', 'A'), item('2', 'B')]
    expect(
      metadataOptions(
        rows.map((row) => row.doc) as Parameters<typeof metadataOptions>[0],
        'subject',
      ),
    ).toEqual(['Toán'])
    expect(relativeUpdatedAt('invalid')).toBe('—')
  })
})
