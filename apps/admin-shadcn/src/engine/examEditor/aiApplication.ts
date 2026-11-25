import { blocksToTipTap, plainText, tipTapToBlocks } from './convert'
import { keyIndex } from '@/engine/lib/aiDocContext'
import { figureDoc, figureImageAttrs } from './toolImages'
import type { ExamBlock, FormatAttrs, RichText } from '@/engine/data/docTypes'
import type { JSONContent } from '@tiptap/core'

/** Hợp đồng AI trả về: thay cả đề / thêm cuối / sửa từng khối theo id (`k<vị trí>`). */
export interface AiExamEnvelope {
  action?: string
  blocks?: unknown
  patch?: unknown
  /** câu trả lời ngắn cho giáo viên (đã hiểu yêu cầu thế nào, đã làm gì) — hiện trong chat */
  say?: unknown
  /** tên đề theo bài (chỉ khi replace) — đặt cho tab còn tên mặc định */
  name?: unknown
  /** một câu nhắc người dùng (vd. nội dung họ yêu cầu nằm ngoài chương trình 2018) — hiện kèm câu tóm tắt */
  warning?: unknown
}

const AI_BLOCK_TYPES = new Set([
  'header',
  'title',
  'meta',
  'student',
  'heading',
  'paragraph',
  'bullets',
  'grid',
  'question',
  'essay',
  'answerKey',
  'rubric',
  'pageBreak',
  'divider',
  'table',
])

/** Chuẩn hoá block AI trả về: đúng loại + field tối thiểu, sai thì bỏ. */
/**
 * AI soạn đề gắn `figure` (cấu hình công cụ vẽ) vào khối cần hình → vẽ bằng công cụ,
 * đặt thành đoạn ảnh căn giữa ngay dưới khối. Ảnh tạm là SVG; `pngifyToolImages` đổi sang PNG sau
 * (xuất Word không đọc SVG). Hình nào cấu hình sai thì bỏ qua, đề vẫn chèn bình thường.
 */
function expandFigures(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object' || !('figure' in item)) return [item]
    const { figure, ...block } = item as Record<string, unknown>
    const doc = figureDoc(figure)
    if (!doc) return [block]
    const { src, alt, width, plot } = figureImageAttrs(doc)
    // câu trắc nghiệm: ảnh vào cuối đề bài (dòng riêng) để nằm TRƯỚC phương án A–D
    if (block.type === 'question') {
      const t = block.text
      const spans = typeof t === 'string' ? [{ text: t }] : Array.isArray(t) ? t : []
      return [{ ...block, text: [...spans, { text: '', image: { src, alt, width, plot } }] }]
    }
    return [block,{ type: 'paragraph', text: [{ text: '', image: { src, alt, width, plot } }], format: { align: 'center' } }]
  })
}

function sanitizeBlocks(raw: unknown): ExamBlock[] {
  if (!Array.isArray(raw)) return []
  // AI có lúc trả mảng trộn string + span; chuẩn hoá về Span[] để converter/export đọc được.
  const rich = (v: unknown): RichText =>
    typeof v === 'string'
      ? v
      : Array.isArray(v)
        ? (v.map((s) => (typeof s === 'string' ? { text: s } : s)) as RichText)
        : ''
  const fmt = (v: unknown): FormatAttrs | undefined =>
    v && typeof v === 'object' ? (v as FormatAttrs) : undefined
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const out: ExamBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    const type = typeof b.type === 'string' ? b.type : ''
    if (!AI_BLOCK_TYPES.has(type)) continue
    switch (type) {
      case 'header': {
        // dạng cũ {"type":"header","text":"…"} → đưa vào cột trái thay vì header rỗng
        const left = rich(b.left) || (typeof b.text === 'string' ? b.text : '')
        out.push({ type: 'header', left, right: rich(b.right) })
        break
      }
      case 'title':
        out.push({ type: 'title', text: rich(b.text), format: fmt(b.format) })
        break
      case 'meta':
        out.push({
          type: 'meta',
          rows: list(b.rows)
            .map((row, i) =>
              Array.isArray(row)
                ? ([String(row[0] ?? ''), rich(row[1])] as [string, RichText])
                : row && typeof row === 'object'
                  ? ([
                      String((row as Record<string, unknown>).label ?? `Dòng ${i + 1}`),
                      rich((row as Record<string, unknown>).value),
                    ] as [string, RichText])
                  : null,
            )
            .filter((r): r is [string, RichText] => r !== null),
        })
        break
      case 'student':
        out.push({ type: 'student', text: rich(b.text), format: fmt(b.format) })
        break
      case 'heading':
        out.push({
          type: 'heading',
          text: rich(b.text),
          level: (b.level === 2 || b.level === 3 ? b.level : 1) as 1 | 2 | 3,
          format: fmt(b.format),
        })
        break
      case 'paragraph':
        out.push({ type: 'paragraph', text: rich(b.text), format: fmt(b.format) })
        break
      case 'bullets':
        out.push({
          type: 'bullets',
          items: list(b.items) as RichText[],
          ...(b.ordered === true ? { ordered: true } : {}),
          ...(Array.isArray(b.levels) ? { levels: b.levels.map(Number) } : {}),
          format: fmt(b.format),
        })
        break
      case 'grid':
        out.push({
          type: 'grid',
          cols: b.cols === 3 ? 3 : 2,
          cells: list(b.cells) as RichText[],
          format: fmt(b.format),
        })
        break
      case 'question': {
        // kind: 'tf' = đúng/sai (4 ý a–d), 'short' = trả lời ngắn (không có phương án); còn lại là trắc nghiệm A–D
        let kind: 'tf' | 'short' | undefined = b.kind === 'tf' || b.kind === 'short' ? b.kind : undefined
        // câu điền chỗ trống bằng chữ (đề đã có dòng chấm) không vẽ 4 ô đáp số của dạng trả lời ngắn
        if (kind === 'short' && /…{3,}|\.{5,}/.test(plainText(rich(b.text)))) kind = undefined
        out.push({
          type: 'question',
          no: typeof b.no === 'number' ? b.no : 1,
          ...(kind ? { kind } : {}),
          text: rich(b.text),
          // chấp nhận cả dạng viết tắt: options: ["A. …", "B. …"]
          options:
            kind === 'short'
              ? []
              : list(b.options).map((o, i) => {
                  const letter = String.fromCharCode((kind === 'tf' ? 97 : 65) + i)
                  if (typeof o === 'string') return { label: letter, text: o }
                  const opt = (o ?? {}) as Record<string, unknown>
                  return {
                    label: typeof opt.label === 'string' ? (kind === 'tf' ? opt.label.toLowerCase() : opt.label) : letter,
                    text: rich(opt.text),
                    format: fmt(opt.format),
                  }
                }),
          format: fmt(b.format),
        })
        break
      }
      case 'essay':
        out.push({
          type: 'essay',
          no: typeof b.no === 'number' ? b.no : 1,
          score: typeof b.score === 'number' ? b.score : 0,
          text: rich(b.text),
          sub: Array.isArray(b.sub) ? (b.sub as RichText[]) : undefined,
          format: fmt(b.format),
        })
        break
      case 'answerKey':
        // chấp nhận items: [{no, answer}] hoặc chuỗi rút gọn "Câu 1. A"
        out.push({
          type: 'answerKey',
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { no: i + 1, answer: it }
              : {
                  no: typeof (it as Record<string, unknown>)?.no === 'number'
                    ? ((it as Record<string, unknown>).no as number)
                    : i + 1,
                  answer: rich((it as Record<string, unknown>)?.answer),
                },
          ),
        })
        break
      case 'rubric':
        out.push({
          type: 'rubric',
          title: b.title == null ? undefined : rich(b.title),
          // chấp nhận items: [{label, text}] hoặc chuỗi rút gọn
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { label: `${i + 1}.`, text: it }
              : {
                  label:
                    typeof (it as Record<string, unknown>)?.label === 'string'
                      ? ((it as Record<string, unknown>).label as string)
                      : `${i + 1}.`,
                  text: rich((it as Record<string, unknown>)?.text),
                },
          ),
        })
        break
      case 'pageBreak':
        out.push({ type: 'pageBreak' })
        break
      case 'divider':
        out.push({ type: 'divider' })
        break
    }
  }
  return out
}

export type PatchOp = 'replace' | 'insertAfter' | 'insertBefore' | 'delete'
interface ExamPatch {
  op: PatchOp
  /** vị trí khối cấp cao nhất (id `k<vị trí>`) */
  index: number
  blocks: ExamBlock[]
  numbers?: number[]
}

/** Các mục patch: {op, id, block|blocks}; thiếu op = thay khối (dạng cũ). Mục sai thì bỏ. */
function sanitizePatches(raw: unknown): ExamPatch[] {
  if (!Array.isArray(raw)) return []
  const out: ExamPatch[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const p = item as Record<string, unknown>
    const index = typeof p.id === 'string' ? keyIndex(p.id) : -1
    if (index < 0) continue
    const op: PatchOp =
      p.op === 'insertAfter' || p.op === 'insertBefore' || p.op === 'delete' ? p.op : 'replace'
    if (op === 'delete') {
      out.push({ op, index, blocks: [] })
      continue
    }
    const list = Array.isArray(p.blocks) ? p.blocks : p.block ? [p.block] : []
    const blocks = sanitizeBlocks(expandFigures(list))
    if (blocks.length) out.push({ op, index, blocks })
  }
  return out
}

export function prepareAiApplication(raw: AiExamEnvelope, currentDocument?: JSONContent) {
  const blocks = sanitizeBlocks(expandFigures(raw.blocks))
  const proposed = sanitizePatches(raw.patch)
  const action: 'append' | 'patch' | 'replace' | 'none' = raw.action === 'append' || raw.action === 'patch' || raw.action === 'replace'
    ? raw.action
    : proposed.length ? 'patch' : blocks.length ? 'replace' : 'none'
  const rank: Record<PatchOp, number> = { insertAfter: 0, replace: 1, delete: 1, insertBefore: 2 }
  const touched = new Set<number>()
  const patches = proposed.filter((patch) => patch.index < (currentDocument?.content?.length ?? Infinity))
    .sort((a, b) => b.index - a.index || rank[a.op] - rank[b.op])
    .filter((patch) => {
      if (patch.op !== 'replace' && patch.op !== 'delete') return true
      if (touched.has(patch.index)) return false
      touched.add(patch.index)
      return true
    })
  type Entry = { node: JSONContent; block?: ExamBlock }
  const entries = (items: ExamBlock[]): Entry[] => items.flatMap((block) => (blocksToTipTap([block]).content ?? []).map((node) => ({ node, block })))
  const result: Entry[] = (currentDocument?.content ?? []).map((node) => ({ node }))
  if (action === 'replace') result.splice(0, result.length, ...entries(blocks))
  if (action === 'append') result.push(...entries(blocks))
  if (action === 'patch') {
    for (const patch of patches) {
      if (!currentDocument) { result.push(...entries(patch.blocks)); continue }
      const at = patch.index + (patch.op === 'insertAfter' ? 1 : 0)
      result.splice(at, patch.op === 'replace' || patch.op === 'delete' ? 1 : 0, ...entries(patch.blocks))
    }
  }
  const numbers = new Map<ExamBlock, number>()
  let question = 0
  let essay = 0
  const visit = (node: JSONContent, block?: ExamBlock) => {
    if (node.type === 'examQuestion') { question++; if (block) numbers.set(block, question) }
    if (node.type === 'examEssay') { essay++; if (block) numbers.set(block, essay) }
    node.content?.forEach((child) => visit(child))
  }
  result.forEach(({ node, block }) => visit(node, block))
  const answers = tipTapToBlocks({ type: 'doc', content: result.map(({ node }) => node) })
    .flatMap((block) => block.type === 'answerKey' ? block.items : [])
  return {
    action,
    blocks,
    patches: patches.map((patch) => ({ ...patch, numbers: patch.blocks.map((block) => numbers.get(block) ?? 0) })),
    numbers: blocks.map((block) => numbers.get(block) ?? 0),
    answers,
  }
}
