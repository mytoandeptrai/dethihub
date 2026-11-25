import { z } from 'zod'

import { readHeader, writeHeader } from './header-slots'
import { children, newTextNode, patchNode, withAttrs, withChildren, withText } from './node-slots'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

export interface InspectorField {
  key: string
  label: string
  kind: 'text' | 'number' | 'textarea' | 'select' | 'list'
  options?: { label: string; value: string | number | boolean }[]
  fields?: InspectorField[]
  fixedLength?: boolean
}

export interface BlockSchema {
  id: string
  label: string
  schema: z.ZodObject<z.ZodRawShape>
  fields: InspectorField[]
  match: (node: ProseMirrorNode) => boolean
  read: (node: ProseMirrorNode) => Record<string, unknown>
  write: (
    tr: Transaction,
    pos: number,
    node: ProseMirrorNode,
    values: Record<string, unknown>,
  ) => Transaction
}

function define<S extends z.ZodRawShape>(config: {
  id: string
  label: string
  shape: S
  fields: InspectorField[]
  match: BlockSchema['match']
  read: (node: ProseMirrorNode) => z.infer<z.ZodObject<S>>
  update: (node: ProseMirrorNode, values: z.infer<z.ZodObject<S>>) => ProseMirrorNode
}): BlockSchema {
  const schema = z.strictObject(config.shape)
  return {
    id: config.id,
    label: config.label,
    fields: config.fields,
    schema,
    match: config.match,
    read: config.read,
    write(tr, pos, node, values) {
      if (!tr.doc.nodeAt(pos)?.eq(node))
        throw new RangeError('Inspector block is stale or position is invalid')
      const current = config.read(node)
      const parsed = schema.parse({ ...current, ...values })
      if (JSON.stringify(current) === JSON.stringify(parsed)) return tr
      const updated = config.update(node, parsed)
      updated.check()
      return patchNode(tr, pos, node, updated)
    },
  }
}

const field = (
  key: string,
  label: string,
  kind: InspectorField['kind'] = 'text',
): InspectorField => ({ key, label, kind })
const list = (
  key: string,
  label: string,
  fields: InspectorField[],
  fixedLength = false,
): InspectorField => ({ key, label, kind: 'list', fields, fixedLength })
const textField = field('text', 'Nội dung', 'textarea')
const noField = field('no', 'Số câu', 'number')
const promptField = field('prompt', 'Nội dung câu hỏi', 'textarea')
const labelField = field('label', 'Nhãn')
const orderedField: InspectorField = {
  ...field('ordered', 'Kiểu danh sách', 'select'),
  options: [
    { label: 'Gạch đầu dòng', value: false },
    { label: 'Đánh số', value: true },
  ],
}
const levelSchema = z.number().int().min(1).max(3)
const noSchema = z.number().int().positive()
const optionSchema = z.strictObject({ label: z.string(), text: z.string() })
const textItemSchema = z.strictObject({ text: z.string() })
const named = (type: string) => (node: ProseMirrorNode) => node.type.name === type
const rubricHeading = (node: ProseMirrorNode) =>
  named('examHeading')(node) && /^HƯỚNG DẪN CHẤM(?:\s|$)/iu.test(node.textContent)
const passage = (node: ProseMirrorNode) =>
  named('examParagraph')(node) && /^Đọc\s.*(?:đoạn|ngữ liệu|trích|văn bản)/iu.test(node.textContent)
const ending = (node: ProseMirrorNode) =>
  named('examParagraph')(node) && /^[-–—\s]*HẾT[-–—\s]*$/iu.test(node.textContent)
const nestedList = (node: ProseMirrorNode) =>
  children(node).some((child) => Number(child.attrs.level) > 0)
const question = (kind: string | null) => (node: ProseMirrorNode) =>
  named('examQuestion')(node) && (node.attrs.kind ?? null) === kind

function textItems(
  parent: ProseMirrorNode,
  type: string,
  items: { text: string; label?: string }[],
): ProseMirrorNode[] {
  const existing = children(parent).filter((node) => named(type)(node))
  if (items.length < existing.length) {
    let cursor = 0
    const retained = items.map((item) => {
      const index = existing.findIndex((node, offset) => offset >= cursor && node.textContent === item.text && (item.label === undefined || node.attrs.label === item.label))
      cursor = index < 0 ? existing.length : index + 1
      return index < 0 ? undefined : existing[index]
    })
    if (retained.every((node): node is ProseMirrorNode => node !== undefined)) return retained
  }
  return items.map((item, index) => {
    const node = existing[index] ?? newTextNode(parent, type, '')
    return withText(
      item.label === undefined ? node : withAttrs(node, { label: item.label }),
      item.text,
    )
  })
}

function simpleText(
  id: string,
  label: string,
  match: BlockSchema['match'],
  heading = false,
): BlockSchema {
  if (heading) {
    return define({
      id,
      label,
      match,
      shape: { text: z.string(), level: levelSchema },
      fields: [textField, field('level', 'Cấp tiêu đề', 'number')],
      read: (node) => ({ text: node.textContent, level: Number(node.attrs.level) }),
      update: (node, values) => withText(withAttrs(node, { level: values.level }), values.text),
    })
  }
  return define({
    id,
    label,
    match,
    shape: { text: z.string() },
    fields: [textField],
    read: (node) => ({ text: node.textContent }),
    update: (node, values) => withText(node, values.text),
  })
}

function listBlock(id: string, label: string, ordered: boolean): BlockSchema {
  return define({
    id,
    label,
    shape: { ordered: z.boolean() },
    fields: [orderedField],
    match: (node) =>
      named('examBullets')(node) && !nestedList(node) && Boolean(node.attrs.ordered) === ordered,
    read: (node) => ({ ordered: Boolean(node.attrs.ordered) }),
    update: (node, values) => withAttrs(node, { ordered: values.ordered }),
  })
}

function grid(id: string, label: string, cols: number): BlockSchema {
  return define({
    id,
    label,
    shape: { cols: z.number().int().min(2).max(3) },
    fields: [field('cols', 'Số cột', 'number')],
    match: (node) => named('examGrid')(node) && Number(node.attrs.cols) === cols,
    read: (node) => ({ cols: Number(node.attrs.cols) }),
    update: (node, values) => withAttrs(node, values),
  })
}

function empty(id: string, label: string, match: BlockSchema['match']): BlockSchema {
  return define({
    id,
    label,
    match,
    shape: {},
    fields: [],
    read: () => ({}),
    update: (node) => node,
  })
}

function choiceQuestion(
  id: string,
  label: string,
  kind: string | null,
  key: 'options' | 'statements',
): BlockSchema {
  const read = (node: ProseMirrorNode) => ({
    no: Number(node.attrs.no),
    prompt: node.firstChild?.textContent ?? '',
    options: children(node)
      .filter((option) => named('examOption')(option))
      .map((option) => ({ label: String(option.attrs.label), text: option.textContent })),
  })
  if (key === 'statements') {
    return define({
      id,
      label,
      match: question(kind),
      shape: { no: noSchema, prompt: z.string(), statements: z.array(optionSchema) },
      fields: [noField, promptField, list('statements', 'Các mệnh đề', [labelField, textField])],
      read: (node) => {
        const values = read(node)
        return { no: values.no, prompt: values.prompt, statements: values.options }
      },
      update: (node, values) =>
        withChildren(withAttrs(node, { no: values.no }), [
          withText(node.child(0), values.prompt),
          ...textItems(node, 'examOption', values.statements),
        ]),
    })
  }
  return define({
    id,
    label,
    match: question(kind),
    shape: { no: noSchema, prompt: z.string(), options: z.array(optionSchema) },
    fields: [noField, promptField, list('options', 'Các phương án', [labelField, textField])],
    read,
    update: (node, values) =>
      withChildren(withAttrs(node, { no: values.no }), [
        withText(node.child(0), values.prompt),
        ...textItems(node, 'examOption', values.options),
      ]),
  })
}

const cellSchema = z.strictObject({ text: z.string() })
const tableSchema = z.strictObject({
  rows: z.array(z.strictObject({ cells: z.array(cellSchema).min(1) })).min(1),
})

function readTables(node: ProseMirrorNode) {
  return children(node)
    .filter((table) => named('table')(table))
    .map((table) => ({
      rows: children(table).map((row) => ({
        cells: children(row).map((cell) => ({
          text: cell.textBetween(0, cell.content.size, '\n'),
        })),
      })),
    }))
}

function writeTables(
  node: ProseMirrorNode,
  tables: z.infer<typeof tableSchema>[],
): ProseMirrorNode {
  const original = children(node).filter((table) => named('table')(table))
  if (tables.length !== original.length) throw new RangeError('Answer tables have fixed structure')
  let index = 0
  return withChildren(
    node,
    children(node).map((table) => {
      if (table.type.name !== 'table') return table
      const values = tables[index++]!
      if (values.rows.length !== table.childCount)
        throw new RangeError('Answer rows have fixed structure')
      return withChildren(
        table,
        children(table).map((row, rowIndex) => {
          const cells = values.rows[rowIndex]!.cells
          if (cells.length !== row.childCount)
            throw new RangeError('Answer cells have fixed structure')
          return withChildren(
            row,
            children(row).map((cell, cellIndex) => {
              const text = cells[cellIndex]!.text
              if (text === cell.textBetween(0, cell.content.size, '\n')) return cell
              const paragraphs = text
                .split('\n')
                .map((line, paragraphIndex) =>
                  withText(
                    cell.maybeChild(paragraphIndex) ?? newTextNode(cell, 'paragraph', ''),
                    line,
                  ),
                )
              return withChildren(cell, paragraphs)
            }),
          )
        }),
      )
    }),
  )
}

export const BLOCK_SCHEMAS: BlockSchema[] = [
  define({
    id: 'header',
    label: 'Đầu đề hai cột',
    match: named('examHeader'),
    shape: {
      soGiaoDuc: z.string(),
      tenTruong: z.string(),
      loaiDe: z.string(),
      maDe: z.string(),
      kyThi: z.string(),
      namHoc: z.string(),
      monThi: z.string(),
      thoiGian: z.number().int().positive().nullable(),
    },
    fields: [
      field('soGiaoDuc', 'Sở giáo dục'),
      field('tenTruong', 'Tên trường'),
      field('loaiDe', 'Loại đề'),
      field('maDe', 'Mã đề'),
      field('kyThi', 'Kỳ thi'),
      field('namHoc', 'Năm học'),
      field('monThi', 'Môn thi'),
      field('thoiGian', 'Thời gian (phút)', 'number'),
    ],
    read: readHeader,
    update: writeHeader,
  }),
  simpleText('title', 'Tiêu đề đề', named('examTitle')),
  define({
    id: 'meta',
    label: 'Thông tin đề',
    match: named('examMeta'),
    shape: { rows: z.array(z.strictObject({ label: z.string(), value: z.string() })).min(1) },
    fields: [list('rows', 'Các dòng thông tin', [labelField, field('value', 'Giá trị')])],
    read: (node) => ({
      rows: children(node).map((row) => ({
        label: String(row.attrs.label),
        value: row.textContent,
      })),
    }),
    update: (node, values) =>
      withChildren(
        node,
        textItems(
          node,
          'examMetaRow',
          values.rows.map((row) => ({ label: row.label, text: row.value })),
        ),
      ),
  }),
  define({
    id: 'student',
    label: 'Thông tin thí sinh',
    match: named('examStudent'),
    shape: { hoTen: z.string(), soBaoDanh: z.string() },
    fields: [field('hoTen', 'Họ và tên thí sinh'), field('soBaoDanh', 'Số báo danh')],
    read: (node) => {
      const parts = node.textContent.match(
        /^\s*Họ và tên thí sinh:\s*([\s\S]*?)\s+Số báo danh:\s*([\s\S]*)$/iu,
      )
      return { hoTen: parts?.[1]?.trim() ?? node.textContent, soBaoDanh: parts?.[2]?.trim() ?? '' }
    },
    update: (node, values) =>
      withText(node, `Họ và tên thí sinh: ${values.hoTen} Số báo danh: ${values.soBaoDanh}`),
  }),
  simpleText('rubric-header', 'Đầu hướng dẫn chấm', rubricHeading, true),
  simpleText(
    'heading',
    'Tiêu đề phần',
    (node) => named('examHeading')(node) && !rubricHeading(node),
    true,
  ),
  choiceQuestion('question', 'Câu trắc nghiệm', null, 'options'),
  define({
    id: 'essay',
    label: 'Câu tự luận',
    match: named('examEssay'),
    shape: {
      no: noSchema,
      prompt: z.string(),
      points: z.number().min(0),
      parts: z.array(textItemSchema),
    },
    fields: [
      noField,
      promptField,
      field('points', 'Điểm', 'number'),
      list('parts', 'Các ý', [textField]),
    ],
    read: (node) => ({
      no: Number(node.attrs.no),
      prompt: node.child(0).textContent,
      points: Number(node.attrs.score),
      parts: children(node)
        .filter((part) => named('examEssaySub')(part))
        .map((part) => ({ text: part.textContent })),
    }),
    update: (node, values) =>
      withChildren(withAttrs(node, { no: values.no, score: values.points }), [
        withText(node.child(0), values.prompt),
        ...textItems(node, 'examEssaySub', values.parts),
      ]),
  }),
  choiceQuestion('truefalse', 'Câu đúng / sai', 'tf', 'statements'),
  define({
    id: 'short',
    label: 'Câu trả lời ngắn',
    match: question('short'),
    shape: { no: noSchema, prompt: z.string() },
    fields: [noField, promptField],
    read: (node) => ({ no: Number(node.attrs.no), prompt: node.child(0).textContent }),
    update: (node, values) =>
      withChildren(
        withAttrs(node, { no: values.no }),
        children(node).map((child, index) =>
          index === 0 ? withText(child, values.prompt) : child,
        ),
      ),
  }),
  simpleText('passage', 'Ngữ liệu / đoạn trích', passage),
  empty(
    'paragraph',
    'Đoạn văn',
    (node) => named('examParagraph')(node) && !passage(node) && !ending(node),
  ),
  listBlock('bullets', 'Danh sách', false),
  listBlock('numbered', 'Danh sách đánh số', true),
  define({
    id: 'multilevel',
    label: 'Danh sách nhiều cấp',
    match: (node) => named('examBullets')(node) && nestedList(node),
    shape: {
      ordered: z.boolean(),
      levels: z.array(z.strictObject({ level: z.number().int().min(0).max(2) })).min(1),
    },
    fields: [
      orderedField,
      list('levels', 'Cấp các mục', [field('level', 'Cấp (0–2)', 'number')], true),
    ],
    read: (node) => ({
      ordered: Boolean(node.attrs.ordered),
      levels: children(node).map((item) => ({ level: Number(item.attrs.level) || 0 })),
    }),
    update: (node, values) => {
      if (values.levels.length !== node.childCount)
        throw new RangeError('List levels must match existing items')
      return withChildren(
        withAttrs(node, { ordered: values.ordered }),
        children(node).map((item, index) =>
          withAttrs(item, { level: values.levels[index]!.level }),
        ),
      )
    },
  }),
  grid('grid2', 'Lưới 2 cột', 2),
  grid('grid3', 'Lưới 3 cột', 3),
  define({
    id: 'answerKey',
    label: 'Bảng đáp án',
    match: named('examAnswerKey'),
    shape: { tables: z.array(tableSchema).min(1) },
    fields: [
      list(
        'tables',
        'Các bảng đáp án',
        [list('rows', 'Các dòng', [list('cells', 'Các ô', [textField], true)], true)],
        true,
      ),
    ],
    read: (node) => ({ tables: readTables(node) }),
    update: (node, values) => writeTables(node, values.tables),
  }),
  define({
    id: 'rubric',
    label: 'Thang điểm',
    match: named('examRubric'),
    shape: { title: z.string(), items: z.array(optionSchema).min(1) },
    fields: [field('title', 'Tiêu đề'), list('items', 'Các ý chấm', [labelField, textField])],
    read: (node) => ({
      title: children(node).find((item) => named('examRubricTitle')(item))?.textContent ?? '',
      items: children(node)
        .filter((item) => named('examRubricItem')(item))
        .map((item) => ({ label: String(item.attrs.label), text: item.textContent })),
    }),
    update: (node, values) => {
      const title = children(node).find((item) => named('examRubricTitle')(item))
      const titles =
        title || values.title
          ? [withText(title ?? newTextNode(node, 'examRubricTitle', ''), values.title)]
          : []
      return withChildren(node, [...titles, ...textItems(node, 'examRubricItem', values.items)])
    },
  }),
  simpleText('end', 'Dòng HẾT', ending),
  empty('divider', 'Đường kẻ', named('examDivider')),
  empty('pageBreak', 'Ngắt trang', named('examPageBreak')),
  empty('toc', 'Mục lục', named('examToc')),
]

export function matchBlockSchema(node: ProseMirrorNode): BlockSchema | undefined {
  return BLOCK_SCHEMAS.find((entry) => entry.match(node))
}
