import { Editor } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { StarterKit } from '@tiptap/starter-kit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BLOCK_SCHEMAS, matchBlockSchema } from './block-registry'

import type { JSONContent, Mark, Node } from '@tiptap/core'

// Runtime fixtures keep legacy engine sources in their own TypeScript project.
const { BaseParagraphNode, EXAM_MARKS, EXAM_NODES } = await vi.importActual<{
  BaseParagraphNode: Node
  EXAM_MARKS: Mark[]
  EXAM_NODES: Node[]
}>('@/engine/examEditor/schema')
const { BLOCK_TEMPLATES } = await vi.importActual<{
  BLOCK_TEMPLATES: { id: string; label: string; build: () => JSONContent | JSONContent[] }[]
}>('@/engine/examEditor/templates')

const editors: Editor[] = []
function createEditor(content: JSONContent[]) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [
      StarterKit.configure({ paragraph: false, underline: false }),
      BaseParagraphNode,
      ...EXAM_MARKS,
      ...EXAM_NODES,
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: { type: 'doc', content },
  })
  editors.push(editor)
  return editor
}

function setup(id: string) {
  const template = BLOCK_TEMPLATES.find((item) => item.id === id)!
  const built = template.build()
  const editor = createEditor(Array.isArray(built) ? built : [built])
  const entry = BLOCK_SCHEMAS.find((item) => item.id === id)!
  let pos = -1
  editor.state.doc.forEach((node, offset) => {
    if (pos === -1 && entry.match(node)) pos = offset
  })
  const node = editor.state.doc.nodeAt(pos)!
  return { editor, entry, node, pos }
}

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy()
})

const expected: Record<string, Record<string, unknown>> = {
  'header': {
    soGiaoDuc: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO …',
    tenTruong: 'TRƯỜNG THPT …',
    loaiDe: 'Đề chính thức',
    maDe: '',
    kyThi: 'KỲ THI …',
    namHoc: 'NĂM HỌC 20… – 20…',
    monThi: '…',
    thoiGian: 90,
  },
  'title': { text: 'ĐỀ KIỂM TRA GIỮA KỲ I' },
  'meta': {
    rows: [
      { label: 'Năm học', value: '2025 – 2026' },
      { label: 'Môn', value: 'Toán – Lớp 9' },
      { label: 'Thời gian', value: '90 phút' },
    ],
  },
  'student': { hoTen: '……………', soBaoDanh: '………' },
  'rubric-header': { text: 'HƯỚNG DẪN CHẤM', level: 1 },
  'heading': { text: 'PHẦN I. TRẮC NGHIỆM (3,0 điểm)', level: 1 },
  'question': {
    no: 1,
    prompt: 'Nội dung câu hỏi',
    options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: `Phương án ${label}` })),
  },
  'essay': {
    no: 1,
    prompt: 'Nội dung câu tự luận',
    points: 1,
    parts: [{ text: 'a) …' }, { text: 'b) …' }],
  },
  'truefalse': {
    no: 1,
    prompt: 'Nội dung câu hỏi. Trong mỗi ý a), b), c), d), chọn đúng hoặc sai.',
    statements: ['a', 'b', 'c', 'd'].map((label) => ({ label, text: `Mệnh đề ${label}` })),
  },
  'short': { no: 1, prompt: 'Nội dung câu hỏi. Đáp án là một số, tối đa 4 ký tự.' },
  'passage': { text: 'Đọc đoạn trích sau và thực hiện các yêu cầu:' },
  'paragraph': {},
  'bullets': { ordered: false },
  'numbered': { ordered: true },
  'multilevel': { ordered: false, levels: [{ level: 0 }, { level: 1 }, { level: 2 }] },
  'grid2': { cols: 2 },
  'grid3': { cols: 3 },
  'answerKey': {
    tables: [
      {
        rows: [
          { cells: [{ text: 'Câu' }, { text: '1' }, { text: '2' }] },
          { cells: [{ text: 'Đáp án' }, { text: 'A' }, { text: 'B' }] },
        ],
      },
    ],
  },
  'rubric': { title: 'A. HƯỚNG DẪN CHUNG', items: [{ label: '1.', text: 'Ý đúng — 1,0 điểm' }] },
  'end': { text: '--------- HẾT ---------' },
  'divider': {},
  'pageBreak': {},
  'toc': {},
}

function changed(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value === 'string') return [key, /^\d+$/.test(value.trim()) ? String(Number(value) + 1) : value ? `${value} sửa` : 'Đã sửa']
      if (typeof value === 'boolean') return [key, !value]
      if (typeof value === 'number')
        return [key, key === 'level' && value === 2 ? 1 : value === 3 ? 2 : value + 1]
      return [key, (value as Record<string, unknown>[]).map((item) => changed(item))]
    }),
  )
}

function cleared(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value === 'string') return [key, key === 'label' || /^\d+$/.test(value.trim()) ? value : '']
      if (typeof value === 'boolean') return [key, false]
      if (typeof value === 'number')
        return [
          key,
          key === 'thoiGian'
            ? null
            : key === 'cols'
              ? 2
              : key === 'points' || (key === 'level' && value === 0)
                ? 0
                : 1,
        ]
      return [key, (value as Record<string, unknown>[]).map((item) => cleared(item))]
    }),
  )
}

describe('template block registry', () => {
  it('preserves every header code line and edits only the first code slot', () => {
    const { editor, entry, node, pos } = setup('header')
    const header = node.toJSON() as JSONContent
    const lines = header.content![0]!.content!
    lines.splice(1, 0, { type: 'paragraph', content: [{ type: 'text', text: 'Mã đề: 101' }] })
    lines.push({ type: 'paragraph', content: [{ type: 'text', text: 'Mã đề: 202', marks: [{ type: 'italic' }] }] })
    editor.commands.setContent({ type: 'doc', content: [header] })
    const original = editor.state.doc.firstChild!
    const untouched = entry.write(editor.state.tr, pos, original, { soGiaoDuc: 'New department' }).doc.firstChild!
    expect(untouched.child(0).childCount).toBe(5)
    expect(untouched.child(0).lastChild!.toJSON()).toEqual(original.child(0).lastChild!.toJSON())
    const updated = entry.write(editor.state.tr, pos, original, { maDe: '303' }).doc.firstChild!
    expect(updated.child(0).child(1).textContent).toBe('Mã đề: 303')
    expect(updated.child(0).lastChild!.toJSON()).toEqual(original.child(0).lastChild!.toJSON())
  })
  it.each(['question', 'truefalse'])('rejects duplicate %s option labels', (id) => {
    const { editor, entry, node, pos } = setup(id)
    const key = id === 'question' ? 'options' : 'statements'
    const values = entry.read(node)
    const options = values[key] as { label: string; text: string }[]
    options[1]!.label = options[0]!.label
    expect(entry.schema.safeParse(values).success).toBe(false)
    expect(() => entry.write(editor.state.tr, pos, node, values)).toThrow()
  })
  it.each(['2.', '', 'two', '-2', '2.5'])('rejects an unexportable answer-key question number %j', (text) => {
    const { editor, entry, node, pos } = setup('answerKey')
    const values = entry.read(node) as { tables: { rows: { cells: { text: string }[] }[] }[] }
    values.tables[0]!.rows[0]!.cells[2]!.text = text
    expect(entry.schema.safeParse(values).success).toBe(false)
    expect(() => entry.write(editor.state.tr, pos, node, values)).toThrow()
  })
  it.each([0, 1, 3])('preserves retained option nodes when removing item %i', (removed) => {
    const { editor, entry, node, pos } = setup('question')
    const marked = node.toJSON() as JSONContent
    marked.content!.slice(1).forEach((option, index) => {
      option.content![0]!.marks = [{ type: index % 2 ? 'italic' : 'bold' }]
    })
    editor.commands.setContent({ type: 'doc', content: [marked] })
    const original = editor.state.doc.firstChild!
    const values = entry.read(original) as { options: { label: string; text: string }[] }
    const expectedNodes = Array.from({ length: 4 }, (_, index) => original.child(index + 1)).filter((_, index) => index !== removed)
    const options = values.options.filter((_, index) => index !== removed)
    const updated = entry.write(editor.state.tr, pos, original, { options }).doc.firstChild!
    expectedNodes.forEach((option, index) => expect(updated.child(index + 1).toJSON()).toEqual(option.toJSON()))
  })
  it('covers the catalog in order with Vietnamese labels and matching schema metadata', () => {
    expect(BLOCK_SCHEMAS.map(({ id, label }) => ({ id, label }))).toEqual(
      BLOCK_TEMPLATES.map(({ id, label }) => ({ id, label })),
    )
    expect(BLOCK_SCHEMAS).toHaveLength(23)
    for (const entry of BLOCK_SCHEMAS)
      expect(entry.fields.map((field) => field.key)).toEqual(Object.keys(entry.schema.shape))
  })

  for (const template of BLOCK_TEMPLATES) {
    it(`${template.id}: build → editor JSON → match/read; write/read; no-op and invalid writes`, () => {
      const { editor, entry, node, pos } = setup(template.id)
      expect(pos).toBeGreaterThanOrEqual(0)
      expect(editor.schema.nodeFromJSON(editor.getJSON()).eq(editor.state.doc)).toBe(true)
      expect(matchBlockSchema(node)?.id).toBe(template.id)
      expect(entry.read(node)).toEqual(expected[template.id])
      expect(entry.schema.safeParse(entry.read(node)).success).toBe(true)
      expect(entry.write(editor.state.tr, pos, node, entry.read(node)).steps).toHaveLength(0)
      const values = changed(entry.read(node))
      const tr = entry.write(editor.state.tr, pos, node, values)
      editor.view.dispatch(tr)
      const updated = editor.state.doc.nodeAt(pos)!
      expect(entry.read(updated)).toEqual(values)
      expect(() => editor.state.doc.check()).not.toThrow()
      expect(() => entry.write(editor.state.tr, pos, updated, { unknownField: 'no' })).toThrow()
    })

    it(`${template.id}: empty text slots remain valid and readable`, () => {
      const { editor, entry, node, pos } = setup(template.id)
      const values = cleared(entry.read(node))
      const tr = entry.write(editor.state.tr, pos, node, values)
      expect(entry.read(tr.doc.nodeAt(pos)!)).toEqual(values)
      expect(() => tr.doc.check()).not.toThrow()
    })
  }

  it('updates header slots, inserts code after the exam type, and preserves marks/paragraph attrs and duration suffix', () => {
    const { editor, entry, pos } = setup('header')
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(2, undefined, {
        ...editor.state.doc.nodeAt(2)!.attrs,
        shading: '#eee',
      }),
    )
    const node = editor.state.doc.nodeAt(pos)!
    const tr = entry.write(editor.state.tr, pos, node, {
      soGiaoDuc: 'SỞ GIÁO DỤC HÀ NỘI',
      thoiGian: 120,
      maDe: '101',
    })
    editor.view.dispatch(tr)
    const header = editor.state.doc.nodeAt(pos)!
    expect(header.child(0).child(0).textContent).toBe('SỞ GIÁO DỤC HÀ NỘI')
    expect(header.child(0).child(0).attrs.shading).toBe('#eee')
    expect(header.child(0).child(3).textContent).toBe('Mã đề: 101')
    expect(
      header
        .child(0)
        .child(2)
        .firstChild!.marks.map((mark) => mark.type.name),
    ).toEqual(['boxed'])
    expect(header.child(1).child(3).textContent).toBe(
      'Thời gian làm bài: 120 phút (không kể thời gian phát đề)',
    )
    expect(
      header
        .child(1)
        .child(3)
        .firstChild!.marks.map((mark) => mark.type.name),
    ).toEqual(['italic'])
    const clearedCode = entry.write(editor.state.tr, pos, header, { maDe: '' })
    expect(entry.read(clearedCode.doc.nodeAt(pos)!).maDe).toBe('')
    expect(clearedCode.doc.nodeAt(pos)!.child(0).childCount).toBe(4)
  })

  it('handles sparse headers and unparseable duration without inventing persisted fields', () => {
    const editor = createEditor([
      {
        type: 'examHeader',
        content: [
          { type: 'examHeaderColumn', content: [{ type: 'paragraph' }] },
          { type: 'examHeaderColumn', content: [{ type: 'paragraph' }] },
        ],
      },
    ])
    const entry = BLOCK_SCHEMAS[0]!
    const node = editor.state.doc.firstChild!
    expect(entry.read(node).thoiGian).toBeNull()
    const tr = entry.write(editor.state.tr, 0, node, { monThi: 'Toán', thoiGian: 45, maDe: '202' })
    expect(entry.read(tr.doc.firstChild!)).toMatchObject({
      monThi: 'Toán',
      thoiGian: 45,
      maDe: '202',
    })
    expect(() => tr.doc.check()).not.toThrow()
  })

  it('keeps unchanged rich content and neighboring blocks; writes at a nonzero position undo together', () => {
    const built = BLOCK_TEMPLATES.find((item) => item.id === 'question')!.build() as JSONContent
    const editor = createEditor([
      { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
      built,
      { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
    ])
    const before = editor.getJSON()
    const pos = editor.state.doc.firstChild!.nodeSize
    const node = editor.state.doc.nodeAt(pos)!
    const entry = matchBlockSchema(node)!
    const options = node.child(1)
    editor.view.dispatch(entry.write(editor.state.tr, pos, node, { prompt: 'Đã sửa', no: 2 }))
    expect(editor.state.doc.nodeAt(pos)!.child(1)).toBe(options)
    expect(editor.state.doc.firstChild!.textContent).toBe('Before')
    expect(editor.state.doc.lastChild!.textContent).toBe('After')
    editor.commands.undo()
    expect(editor.getJSON()).toEqual(before)
  })

  it('uses the first text marks when replacing a mixed-mark line', () => {
    const editor = createEditor([
      {
        type: 'examTitle',
        attrs: { align: 'right' },
        content: [
          { type: 'text', text: 'First', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' second', marks: [{ type: 'italic' }] },
        ],
      },
    ])
    const node = editor.state.doc.firstChild!
    const tr = matchBlockSchema(node)!.write(editor.state.tr, 0, node, { text: 'New title' })
    expect(tr.doc.firstChild!.firstChild!.marks.map((mark) => mark.type.name)).toEqual(['bold'])
    expect(tr.doc.firstChild!.attrs.align).toBe('right')
  })

  it('retains empty slots and handles list additions/removals and missing rubric title', () => {
    const { editor, entry, node, pos } = setup('rubric')
    const tr = entry.write(editor.state.tr, pos, node, {
      title: '',
      items: [
        { label: 'a', text: '' },
        { label: 'b', text: 'New' },
      ],
    })
    expect(entry.read(tr.doc.firstChild!)).toEqual({
      title: '',
      items: [
        { label: 'a', text: '' },
        { label: 'b', text: 'New' },
      ],
    })
    const noTitle = createEditor([{ type: 'examRubric', content: [{ type: 'examRubricItem' }] }])
    const added = entry.write(noTitle.state.tr, 0, noTitle.state.doc.firstChild!, {
      title: 'Barem',
    })
    expect(entry.read(added.doc.firstChild!).title).toBe('Barem')
    expect(() => entry.write(editor.state.tr, pos, node, { items: [] })).toThrow()
  })

  it('rejects stale positions, invalid numbers and unknown nodes without modifying the transaction', () => {
    const { editor, entry, node, pos } = setup('essay')
    const tr = editor.state.tr
    expect(() => entry.write(tr, pos + 1, node, { prompt: 'Bad' })).toThrow()
    expect(() => entry.write(tr, pos, node, { points: -1 })).toThrow()
    expect(() => entry.write(tr, pos, node, { no: Number.NaN })).toThrow()
    expect(tr.steps).toHaveLength(0)
    expect(matchBlockSchema(editor.schema.nodes.paragraph!.create())).toBeUndefined()
  })

  it('preserves answer cell types, spans, paragraph attrs and marks and rejects structure changes', () => {
    const { editor, entry } = setup('answerKey')
    let tr = editor.state.tr
    tr.doc.descendants((node, pos) => {
      if (node.type.name === 'tableHeader')
        tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, colspan: 2 })
    })
    editor.view.dispatch(tr)
    const node = editor.state.doc.firstChild!
    const values = entry.read(node) as { tables: { rows: { cells: { text: string }[] }[] }[] }
    values.tables[0]!.rows[0]!.cells[0]!.text = 'Số câu\nTiếp'
    const edited = entry.write(editor.state.tr, 0, node, values)
    const header = edited.doc.firstChild!.child(0).child(0).child(0)
    expect(header.type.name).toBe('tableHeader')
    expect(header.attrs.colspan).toBe(2)
    expect(header.childCount).toBe(2)
    expect(entry.read(edited.doc.firstChild!)).toEqual(values)
    expect(() => edited.doc.check()).not.toThrow()
    const invalid = editor.state.tr
    expect(() => entry.write(invalid, 0, node, { tables: [] })).toThrow()
    expect(() =>
      entry.write(invalid, 0, node, { tables: [{ rows: [{ cells: [{ text: 'wrong shape' }] }] }] }),
    ).toThrow()
    expect(invalid.steps).toHaveLength(0)
  })

  it('re-matches structural variants and documents semantic multi-node anchors without claiming provenance', () => {
    const { editor, entry, node, pos } = setup('grid2')
    expect(
      matchBlockSchema(entry.write(editor.state.tr, pos, node, { cols: 3 }).doc.firstChild!)?.id,
    ).toBe('grid3')
    const {
      editor: passageEditor,
      entry: passageEntry,
      node: passageNode,
      pos: passagePos,
    } = setup('passage')
    const siblings = passageEditor.state.doc.content
    const tr = passageEntry.write(passageEditor.state.tr, passagePos, passageNode, {
      text: 'Lời dẫn mới',
    })
    expect(matchBlockSchema(tr.doc.firstChild!)?.id).toBe('paragraph')
    expect(tr.doc.child(1)).toBe(siblings.child(1))
    expect(tr.doc.child(3)).toBe(siblings.child(3))
  })
})
