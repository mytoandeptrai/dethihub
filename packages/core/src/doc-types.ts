import type { Exam } from './types.js'

export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'sub'
  | 'super'
  | 'highlight'
  | 'textStyle'
  | 'boxed'

export interface Mark {
  type: MarkType

  attrs?: Record<string, unknown>
}

export interface Span {
  text: string
  marks?: Mark[]

  image?: { src: string; alt?: string; width?: number; plot?: string }
}

export type RichText = string | Span[]

export interface FormatAttrs {
  align?: 'left' | 'center' | 'right' | 'justify'

  dir?: 'ltr' | 'rtl'
  lineHeight?: number
  indentLeft?: number
  indentFirstLine?: number
  spaceBefore?: number
  spaceAfter?: number
  borders?: 'top' | 'bottom' | 'left' | 'right' | 'box' | 'none'
  shading?: string
}

export type BlockType =
  | 'header'
  | 'title'
  | 'meta'
  | 'student'
  | 'heading'
  | 'paragraph'
  | 'bullets'
  | 'grid'
  | 'question'
  | 'essay'
  | 'answerKey'
  | 'rubric'
  | 'pageBreak'
  | 'divider'
  | 'table'
  | 'toc'
  | 'columns'

export interface HeaderBlock {
  type: 'header'
  left: RichText
  right: RichText
}

export interface TitleBlock {
  type: 'title'
  text: RichText
  format?: FormatAttrs
}

export interface MetaBlock {
  type: 'meta'
  rows: [string, RichText][]
}

export interface StudentBlock {
  type: 'student'
  text: RichText
  format?: FormatAttrs
}

export interface HeadingBlock {
  type: 'heading'
  text: RichText
  level?: 1 | 2 | 3
  format?: FormatAttrs
}

export interface ParagraphBlock {
  type: 'paragraph'
  text: RichText
  format?: FormatAttrs
}

export interface BulletsBlock {
  type: 'bullets'
  items: RichText[]

  ordered?: boolean

  levels?: number[]
  format?: FormatAttrs
}

export interface GridBlock {
  type: 'grid'

  cols: 2 | 3
  cells: RichText[]
  format?: FormatAttrs
}

export interface QuestionBlock {
  type: 'question'
  no: number

  // mcq: options A-D; tf: four statements a-d in `options`; short: no options, numeric answer up to 4 chars
  kind?: 'mcq' | 'tf' | 'short'
  text: RichText

  imagePosition?: 'left' | 'right'
  options: { label: string; text: RichText; format?: FormatAttrs }[]

  format?: FormatAttrs
}

export interface EssayBlock {
  type: 'essay'
  no: number
  text: RichText

  imagePosition?: 'left' | 'right'
  score: number
  sub?: RichText[]
  format?: FormatAttrs
}

export interface AnswerKeyBlock {
  type: 'answerKey'
  items: { no: number; answer: RichText }[]
}

export interface RubricBlock {
  type: 'rubric'
  title?: RichText
  items: { label: string; text: RichText }[]
}

export interface PageBreakBlock {
  type: 'pageBreak'
}

export interface DividerBlock {
  type: 'divider'
}

export interface ColumnsBlock {
  type: 'columns'
  cols: RichText[]
}

export interface TocBlock {
  type: 'toc'
}

export interface TableCellData {
  text: RichText
  header?: boolean
  colSpan?: number
  rowSpan?: number
  align?: 'left' | 'center' | 'right'
  shading?: string
  format?: FormatAttrs
}

export interface TableBlock {
  type: 'table'
  rows: TableCellData[][]
  colWidths?: number[]
  format?: FormatAttrs
}

export type ExamBlock =
  | HeaderBlock
  | TitleBlock
  | MetaBlock
  | StudentBlock
  | HeadingBlock
  | ParagraphBlock
  | BulletsBlock
  | GridBlock
  | QuestionBlock
  | EssayBlock
  | AnswerKeyBlock
  | RubricBlock
  | PageBreakBlock
  | DividerBlock
  | TableBlock
  | TocBlock
  | ColumnsBlock

export type DocKind = 'exam' | 'slide' | 'board'

export interface ExamDoc {
  id: string
  title: string

  kind?: DocKind
  subject: string
  grade: string
  term: string
  schoolYear: string
  duration: string
  unit: string
  authority: string
  blocks: ExamBlock[]

  online?: Exam

  createdAt: string
  updatedAt: string
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function emptyDoc(overrides: Partial<ExamDoc> = {}): ExamDoc {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: 'Đề thi mới',
    subject: 'Toán',
    grade: 'Lớp 9',
    term: 'Giữa kỳ I',
    schoolYear: '2025 – 2026',
    duration: '90 phút',
    unit: 'TRƯỜNG THCS …',
    authority: 'UBND XÃ/PHƯỜNG …',
    blocks: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
