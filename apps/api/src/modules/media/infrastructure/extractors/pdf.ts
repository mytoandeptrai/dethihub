import { EMPH_OFF, EMPH_ON, MAX_TEXT } from '@/modules/media/infrastructure/extractors/text'

import type { TextItem } from 'pdfjs-dist/types/src/display/api.js'

/** "Emphasised" text colour: tinted or light grey; black and dark grey are plain text. */
function isEmphasisColor(hex: string): boolean {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 40 || Math.max(r, g, b) > 110
}

type Matrix = [number, number, number, number, number, number]

const toMatrix = (v: ArrayLike<number>): Matrix => [
  v[0] ?? 0,
  v[1] ?? 0,
  v[2] ?? 0,
  v[3] ?? 0,
  v[4] ?? 0,
  v[5] ?? 0,
]

interface Seg {
  x1: number
  x2: number
  y1: number
  y2: number
  color: string
}

/**
 * A PDF does not store bold / colour / underline with the text, so they are pieced together: pdf.js
 * `fontExtraProperties` gives the original font name → bold/italic; the fill colour is tracked through the operator list → text colour;
 * thin lines right under the text → underline / strike; filled rectangles behind the text → highlight.
 * Returns, in `getTextContent` order, which items are emphasised.
 */
async function pdfEmphasis(
  pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs'),
  page: import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy,
  items: { str: string; transform: number[]; width: number }[],
): Promise<boolean[]> {
  const { OPS } = pdfjs
  const ops = await page.getOperatorList()
  const showOps = new Set<number>([
    OPS.showText,
    OPS.showSpacedText,
    OPS.nextLineShowText,
    OPS.nextLineSetSpacingShowText,
  ])
  const paintOps = new Set<number>([
    OPS.stroke,
    OPS.closeStroke,
    OPS.fill,
    OPS.eoFill,
    OPS.fillStroke,
    OPS.eoFillStroke,
    OPS.closeFillStroke,
    OPS.closeEOFillStroke,
  ])
  const fillOps = new Set<number>([
    OPS.fill,
    OPS.eoFill,
    OPS.fillStroke,
    OPS.eoFillStroke,
    OPS.closeFillStroke,
    OPS.closeEOFillStroke,
  ])
  const colorOps = new Set<number>([OPS.setFillRGBColor, OPS.setFillGray, OPS.setFillCMYKColor])
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  const stack: Matrix[] = []
  let fill = '#000000'
  let stroke = '#000000'
  const runs: { x: number; y: number; color: string }[] = []
  let tm: Matrix = [1, 0, 0, 1, 0, 0]
  let leading = 0
  const move = (tx: number, ty: number) => {
    const [a, b, c, d, e, f] = tm
    tm = [a, b, c, d, tx * a + ty * c + e, tx * b + ty * d + f]
  }
  const showAt = () => {
    const [a, b, c, d, e, f] = ctm
    runs.push({ x: a * tm[4] + c * tm[5] + e, y: b * tm[4] + d * tm[5] + f, color: fill })
  }
  const lines: Seg[] = []
  const rects: Seg[] = []
  for (let i = 0; i < ops.fnArray.length; i++) {
    const op = ops.fnArray[i] ?? -1
    const args = (ops.argsArray[i] ?? []) as unknown[]
    if (op === OPS.save) stack.push(ctm)
    else if (op === OPS.restore) ctm = stack.pop() ?? ctm
    else if (op === OPS.transform) {
      const [a, b, c, d, e, f] = toMatrix(args as number[])
      const [A, B, C, D, E, F] = ctm
      ctm = [
        A * a + C * b,
        B * a + D * b,
        A * c + C * d,
        B * c + D * d,
        A * e + C * f + E,
        B * e + D * f + F,
      ]
    } else if (colorOps.has(op) && typeof args[0] === 'string') fill = args[0] as string
    else if (op === OPS.setStrokeRGBColor && typeof args[0] === 'string') stroke = args[0] as string
    else if (op === OPS.beginText) tm = [1, 0, 0, 1, 0, 0]
    else if (op === OPS.setTextMatrix) {
      // pdf.js returns the matrix either as 6 numbers or as an object {0..5}
      const m =
        args.length === 1 && typeof args[0] === 'object'
          ? (args[0] as Record<number, number>)
          : (args as number[])
      tm = toMatrix([0, 1, 2, 3, 4, 5].map((k) => m[k] ?? 0))
    } else if (op === OPS.moveText) move(args[0] as number, args[1] as number)
    else if (op === OPS.setLeadingMoveText) {
      leading = -(args[1] as number)
      move(args[0] as number, args[1] as number)
    } else if (op === OPS.setLeading) leading = args[0] as number
    else if (op === OPS.nextLine) move(0, -leading)
    else if (showOps.has(op)) {
      if (op === OPS.nextLineShowText || op === OPS.nextLineSetSpacingShowText) move(0, -leading)
      const glyphs = Array.isArray(args[0]) ? (args[0] as ({ unicode?: string } | number)[]) : []
      if (glyphs.some((g) => typeof g === 'object' && g?.unicode?.trim())) showAt() // ignore shows made only of spaces
    } else if (op === OPS.constructPath) {
      const [paint, , box] = args as [number, unknown, Record<number, number>]
      if (!paintOps.has(paint) || !box) continue
      const [a, b, c, d, e, f] = ctm
      const corner = (x: number, y: number): [number, number] => [
        a * x + c * y + e,
        b * x + d * y + f,
      ]
      const [x0, y0] = corner(box[0] ?? 0, box[1] ?? 0)
      const [x1, y1] = corner(box[2] ?? 0, box[3] ?? 0)
      const seg = {
        x1: Math.min(x0, x1),
        x2: Math.max(x0, x1),
        y1: Math.min(y0, y1),
        y2: Math.max(y0, y1),
        color: fillOps.has(paint) ? fill : stroke,
      }
      if (seg.y2 - seg.y1 <= 1.5 && seg.x2 - seg.x1 > 2) lines.push(seg)
      else if (fillOps.has(paint) && !/^#(?:[ef][0-9a-f]){3}$/i.test(seg.color)) rects.push(seg)
    }
  }
  return items.map((it) => {
    if (it.str === '') return false
    const [, , , size = 0, x = 0, y = 0] = it.transform
    const h = Math.abs(size) || 10
    const overlap = (s: Seg) => Math.min(x + it.width, s.x2) - Math.max(x, s.x1)
    // text colour: the shows (by position) inside this item's box, most of them with an emphasised colour
    const inside = runs.filter(
      (r) => Math.abs(r.y - y) < 0.3 * h && r.x >= x - 1 && r.x <= x + it.width + 1,
    )
    const colored =
      inside.length > 0 &&
      inside.filter((r) => isEmphasisColor(r.color)).length * 2 >= inside.length
    const underlined = lines.some(
      (s) => overlap(s) >= it.width * 0.5 && s.y1 >= y - 0.35 * h && s.y2 <= y + 0.5 * h,
    )
    const highlighted = rects.some(
      (s) =>
        overlap(s) >= it.width * 0.6 &&
        s.y1 <= y + 0.1 * h &&
        s.y2 >= y + 0.6 * h &&
        s.y2 - s.y1 < 2.5 * h,
    )
    return colored || underlined || highlighted
  })
}

/** Bold/italic from the original font name (Arial-BoldMT, TimesNewRomanPS-ItalicMT, …). */
async function fontStyleOf(
  page: import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy,
  fontName: string,
): Promise<boolean> {
  const font = await new Promise<{ name?: string } | null>((resolve) => {
    try {
      page.commonObjs.get(fontName, resolve)
    } catch {
      resolve(null)
    }
  })
  return /bold|italic|oblique|black|heavy/i.test(font?.name ?? '')
}

async function markStyledFonts(
  page: import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy,
  items: TextItem[],
  flags: boolean[],
): Promise<void> {
  const styled = new Map<string, boolean>()
  for (const [i, item] of items.entries()) {
    const name = (item as { fontName?: string }).fontName ?? ''
    if (!styled.has(name)) styled.set(name, await fontStyleOf(page, name))
    if (item.str !== '' && styled.get(name)) flags[i] = true
  }
}

export async function extractPdf(data: Buffer, marks = false): Promise<string> {
  // The bundled function cannot find pdf.worker.mjs on its own; load it up front so pdf.js uses it
  const g = globalThis as { pdfjsWorker?: unknown }
  // @ts-expect-error pdf.js ships no types for the worker file
  if (!g.pdfjsWorker) g.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    ...(marks ? { fontExtraProperties: true } : {}),
  })
  const doc = await task.promise
  const pages: string[] = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const items = content.items.filter((it): it is TextItem => 'str' in it)
      let flags: boolean[] = []
      if (marks) {
        flags = await pdfEmphasis(pdfjs, page, items)
        await markStyledFonts(page, items, flags)
      }
      let text = ''
      items.forEach((item, i) => {
        text += flags[i] && item.str.trim() ? `${EMPH_ON}${item.str}${EMPH_OFF}` : item.str
        text += item.hasEOL ? '\n' : ' '
      })
      pages.push(text.trim())
      if (pages.join('\n\n').length > MAX_TEXT * 1.2) break
    }
  } finally {
    await task.destroy()
  }
  return pages.join('\n\n')
}
