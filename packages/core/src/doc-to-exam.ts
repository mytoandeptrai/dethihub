import { formatTrueFalse, normalizeShort, parseTrueFalse } from './grading.js'

import type { EssayBlock, ExamDoc, QuestionBlock, RichText } from './doc-types.js'
import type { Exam, Question, QuestionImage, Section, Subject } from './types.js'

function toRich(rt: RichText | undefined, skip?: unknown): string {
  if (!rt) return ''
  if (typeof rt === 'string') return rt
  return rt
    .map((s) => {
      if (s.image) {
        if (s.image === skip) return ''
        const { src, alt, width } = s.image
        const pct = width ? Math.min(100, Math.max(10, Math.round((width / 643) * 100))) : 0
        return `\n![${(alt ?? '').replaceAll(/[\]|\n]/g, ' ')}${pct ? `|${pct}` : ''}](${src})\n`
      }
      const has = (t: string) => s.marks?.some((m) => m.type === t)
      const core = s.text.trim()
      if (!core || s.text.includes('$') || !s.marks?.length) return s.text
      let w = core
      if (has('italic')) w = `*${w}*`
      if (has('bold')) w = `**${w}**`
      if (has('underline')) w = `__${w}__`
      return s.text.replace(core, w)
    })
    .join('')
}

const ALIGN = new Set(['center', 'right', 'justify'])
const alignOf = (b: QuestionBlock | EssayBlock) => {
  const a = (b as { format?: { align?: string } }).format?.align
  return a && ALIGN.has(a) ? { align: a as 'center' | 'right' | 'justify' } : {}
}

function toPlain(rt: RichText | undefined): string {
  if (!rt) return ''
  return typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')
}

function promptImage(
  ...parts: (RichText | undefined)[]
): (QuestionImage & { _from?: unknown }) | undefined {
  for (const rt of parts) {
    if (!rt || typeof rt === 'string') continue
    const at = rt.findIndex((sp) => sp.image)
    if (at < 0) continue
    const image = rt[at]?.image
    if (!image) continue
    const { src, alt, width, plot } = image
    const first = !rt.slice(0, at).some((sp) => sp.text.trim())
    const pct = width ? Math.min(100, Math.max(10, Math.round((width / 643) * 100))) : undefined
    return {
      src,
      _from: image,
      position: first ? 'top' : 'bottom',
      ...(alt ? { alt } : {}),
      ...(plot ? { plot } : {}),
      ...(pct ? { width: pct } : {}),
    }
  }
  return undefined
}

function withImage(...parts: (RichText | undefined)[]): {
  prompt: string
  image?: QuestionImage
} {
  const img = promptImage(...parts)
  const prompt = parts
    .map((p) => toRich(p, img?._from).trim())
    .filter(Boolean)
    .join('\n')
  if (!img) return { prompt }
  const { _from, ...image } = img
  void _from
  return { prompt, image }
}

function letterOf(raw: string | undefined): string | undefined {
  const m = raw?.match(/^\s*([A-D])\b/i)
  return m?.[1]?.toUpperCase()
}

const round2 = (n: number) => Math.round(n * 100) / 100

const NUMERIC = /^[-+]?\d+([.,]\d+)?$/

const SOLUTION_HEAD = /lời giải|hướng dẫn giải|giải thích/i

function explanations(blocks: ExamDoc['blocks']): Map<string, string> {
  const out = new Map<string, string>()
  let at = -1
  blocks.forEach((b, i) => {
    if ((b.type === 'heading' || b.type === 'title') && SOLUTION_HEAD.test(toPlain(b.text))) at = i
  })
  let cur = ''
  for (const b of blocks.slice(at + 1)) {
    if (at < 0) break
    const lines =
      b.type === 'paragraph' ? [toPlain(b.text)] : b.type === 'bullets' ? b.items.map(toPlain) : []
    for (const line of lines) {
      const m = line.match(/^\s*(Câu|Bài)\s*(\d+)\s*[.:)–-]?\s*([\s\S]*)$/i)
      if (m) {
        const [, kind = '', no = '', body = ''] = m
        cur = (kind.toLowerCase() === 'bài' ? 'b' : 'c') + no
        out.set(cur, body.trim())
      } else if (cur && line.trim()) out.set(cur, `${out.get(cur)}\n${line.trim()}`.trim())
    }
  }
  return out
}

const ROMAN = ['I', 'II', 'III', 'IV']

export function docToExam(doc: ExamDoc, id: string): Exam {
  if (doc.online) return { ...doc.online, id }
  const keys = new Map<number, string[]>()
  for (const b of doc.blocks) {
    if (b.type !== 'answerKey') continue
    for (const it of b.items) {
      keys.set(it.no, [...(keys.get(it.no) ?? []), toPlain(it.answer).trim()])
    }
  }
  const mcqAnswer = (no: number) => (keys.get(no) ?? []).map((a) => letterOf(a)).find(Boolean)
  const used = new Map<number, string[]>()
  const take = (no: number, pick: (a: string) => boolean): string | undefined => {
    const found = (keys.get(no) ?? []).find((a) => pick(a))
    if (found !== undefined) used.set(no, [...(used.get(no) ?? []), found])
    return found
  }
  const essayAnswer = (no: number) =>
    (keys.get(no) ?? []).find((a) => !letterOf(a) && !(used.get(no) ?? []).includes(a))

  const explain = explanations(doc.blocks)
  const questionBlocks = doc.blocks.filter((b): b is QuestionBlock => b.type === 'question')
  const mcqBlocks = questionBlocks.filter((b) => b.kind !== 'tf' && b.kind !== 'short')
  const tfBlocks = questionBlocks.filter((b) => b.kind === 'tf')
  const shortBlocks = questionBlocks.filter((b) => b.kind === 'short')
  const essayBlocks = doc.blocks.filter((b): b is EssayBlock => b.type === 'essay')
  const essayTotal = essayBlocks.reduce((n, b) => n + (b.score || 0), 0)
  const shortPoints = doc.subject === 'Toán' ? 0.5 : 0.25
  const fixedTotal = essayTotal + tfBlocks.length + shortBlocks.length * shortPoints
  const mcqTotal = fixedTotal > 0 ? Math.max(10 - fixedTotal, 0) : 10
  const mcqPoints = mcqBlocks.length > 0 ? round2(mcqTotal / mcqBlocks.length) : 0

  let counter = 0
  const mcqs: Question[] = []
  for (const [i, b] of mcqBlocks.entries()) {
    mcqs.push({
      id: `${id}-m${i}`,
      number: ++counter,
      type: 'trac-nghiem',
      ...withImage(b.text),
      ...alignOf(b),
      options: b.options.map((o) => ({ key: o.label, text: toRich(o.text).trim() })),
      answer: mcqAnswer(b.no),
      explanation: explain.get(`c${b.no}`) || undefined,
      points: mcqPoints,
    })
  }

  const tfs: Question[] = []
  for (const [i, b] of tfBlocks.entries()) {
    const n = b.options.length
    const raw = take(b.no, (a) => parseTrueFalse(a, n) !== null)
    const parsed = parseTrueFalse(raw, n)
    tfs.push({
      id: `${id}-t${i}`,
      number: ++counter,
      type: 'dung-sai',
      ...withImage(b.text),
      ...alignOf(b),
      options: b.options.map((o) => ({ key: o.label.toLowerCase(), text: toRich(o.text).trim() })),
      answer: parsed ? formatTrueFalse(parsed) : undefined,
      explanation: explain.get(`c${b.no}`) || undefined,
      points: 1,
    })
  }

  const shorts: Question[] = []
  for (const [i, b] of shortBlocks.entries()) {
    const raw = take(b.no, (a) => NUMERIC.test(a.replaceAll(/\s+/g, '')))
    shorts.push({
      id: `${id}-s${i}`,
      number: ++counter,
      type: 'tra-loi-ngan',
      ...withImage(b.text),
      ...alignOf(b),
      answer: raw ? normalizeShort(raw) : undefined,
      explanation: explain.get(`c${b.no}`) || undefined,
      points: shortPoints,
    })
  }

  const essays: Question[] = []
  for (const [i, b] of essayBlocks.entries()) {
    const answer = essayAnswer(b.no)
    const written = explain.get(`b${b.no}`)
    essays.push({
      id: `${id}-e${i}`,
      number: i + 1,
      type: 'tu-luan',
      prompt: [toRich(b.text), ...(b.sub ?? []).map((s) => toRich(s))].filter(Boolean).join('\n'),
      ...alignOf(b),
      image: promptImage(b.text, ...(b.sub ?? [])),
      points: b.score,
      solution: written ? written.split('\n') : answer ? [answer] : undefined,
    })
  }

  const sections: Section[] = []
  const addSection = (name: string, questions: Question[]) => {
    if (questions.length === 0) return
    sections.push({
      id: `${id}-s${sections.length + 1}`,
      title: `PHẦN ${ROMAN[sections.length]}. ${name}`,
      points: round2(questions.reduce((n, q) => n + q.points, 0)),
      questions,
    })
  }
  addSection('TRẮC NGHIỆM', mcqs)
  addSection('ĐÚNG/SAI', tfs)
  addSection('TRẢ LỜI NGẮN', shorts)
  addSection('TỰ LUẬN', essays)

  const heading = doc.blocks.find((b) => b.type === 'title')
  const headTitle = heading && 'text' in heading ? toPlain(heading.text as RichText).trim() : ''
  const title =
    (!doc.title.trim() || doc.title === 'Đề thi mới') && headTitle ? headTitle : doc.title
  const pageText = doc.blocks.flatMap((b) =>
    'text' in b && b.type !== 'question' && b.type !== 'essay' ? [toPlain(b.text as RichText)] : [],
  )
  const timeLine = pageText
    .map((t) => /thời gian[^\d]{0,30}(\d{1,3})\s*phút/i.exec(t)?.[1])
    .find(Boolean)

  return {
    id,
    title,
    subject: doc.subject as Subject,
    grade: doc.grade,
    school: doc.unit,
    year: doc.schoolYear,
    term: doc.term,
    durationMinutes: Number(timeLine) || parseInt(doc.duration, 10) || 45,
    interactive: true,
    sections,
    author: 'Giáo viên',
    createdAt: doc.createdAt,
    views: 0,
    likes: 0,
    shared: true,
  }
}
