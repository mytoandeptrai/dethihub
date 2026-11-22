import { EMPH_OFF, EMPH_ON } from '@/modules/media/infrastructure/extractors/text'
import {
  attr,
  mapXmlBlocks,
  openTag,
  xmlBlocks,
} from '@/modules/media/infrastructure/extractors/xml'

function isEmphasised(rPr: string): boolean {
  if (/<w:(b|i|strike|dstrike)\s*\/>|<w:(b|i|strike|dstrike)\s+w:val="(1|true|on)"/.test(rPr))
    return true
  if (/<w:u\s+w:val="(?!none")/.test(rPr)) return true
  if (/<w:highlight\s+w:val="(?!none")/.test(rPr)) return true
  if (/<w:shd\b[^>]*w:fill="(?!auto"|FFFFFF")/i.test(rPr)) return true
  const color = rPr.match(/<w:color\s+w:val="([0-9A-Fa-f]{6})"/)?.[1]
  if (!color) return false
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => parseInt(color.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 40 || Math.max(r, g, b) > 110 // coloured or light grey counts; black and dark grey are plain text
}

const IMG_ON = ''
const IMG_OFF = ''
const MAX_RAW_IMAGES = 1500 // embedded images read in, before stitching pieces
const MAX_IMAGES = 600 // images returned, after stitching
const MAX_IMAGE_BYTES = 600 * 1024
const MAX_RAW_BYTES = 40 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024
const MIN_IMAGE_EMU = 24 * 9525 // an image whose longest side is under ~24px is a decorative icon
const MIN_LINE_EMU = 4 * 9525 // a shorter side under ~4px is a rule line
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

/** Shrinks or recompresses an oversized image with @napi-rs/canvas; null when that is not possible. */
async function shrinkImage(buf: Buffer): Promise<Buffer | null> {
  try {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas')
    const img = await loadImage(buf)
    for (const [maxSide, quality] of [
      [1400, 82],
      [1000, 70],
      [700, 60],
    ] as const) {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = createCanvas(
        Math.max(1, Math.round(img.width * k)),
        Math.max(1, Math.round(img.height * k)),
      )
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toBuffer('image/jpeg', quality)
      if (out.length <= MAX_IMAGE_BYTES) return out
    }
  } catch {
    /* no canvas, or a broken image */
  }
  return null
}

/**
 * Replaces each embedded image in document.xml with a text run `U+E002<index>U+E003` at its exact position,
 * so mammoth `extractRawText` keeps the order. Decorative images (<~24px), EMF/WMF and oversized images are dropped.
 */
async function tokenizeImages(
  zip: import('jszip'),
  xmlIn: string,
): Promise<{ xml: string; images: string[]; warning?: string }> {
  const relsFile = zip.file('word/_rels/document.xml.rels')
  if (!relsFile) return { xml: xmlIn, images: [] }
  const rels = new Map<string, string>()
  const relsXml = await relsFile.async('string')
  for (
    let at = relsXml.indexOf('<Relationship');
    at >= 0;
    at = relsXml.indexOf('<Relationship', at + 1)
  ) {
    const gt = relsXml.indexOf('>', at)
    if (gt < 0) break
    const tag = relsXml.slice(at, gt + 1)
    const id = tag.match(/\bId="([^"]+)"/)?.[1]
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1]
    if (id && target && (tag.match(/\bType="([^"]+)"/)?.[1] ?? '').endsWith('/image'))
      rels.set(id, target)
  }
  if (rels.size === 0) return { xml: xmlIn, images: [] }
  // mc:AlternateContent: keep the Choice part (avoids counting an image twice with its VML Fallback)
  const xml = mapXmlBlocks(
    xmlIn,
    'mc:AlternateContent',
    (block) => xmlBlocks(block, 'mc:Choice').next().value?.inner ?? block,
  )
  const images: string[] = []
  const byTarget = new Map<string, number>()
  let total = 0
  let unsupported = 0
  let tooBig = 0
  let overLimit = 0
  const resolve = async (rid: string): Promise<number | null> => {
    const target = rels.get(rid)
    if (!target) return null
    if (byTarget.has(target)) return byTarget.get(target)!
    const ext = target.split('.').pop()?.toLowerCase() ?? ''
    const path = target.startsWith('/') ? target.slice(1) : `word/${target}`
    const file = zip.file(path)
    if (!MIME[ext] || !file) {
      unsupported++
      return null
    }
    let data = await file.async('nodebuffer')
    let mime = MIME[ext]
    if (data.length > MAX_IMAGE_BYTES) {
      const small = ext === 'svg' ? null : await shrinkImage(data)
      if (!small) {
        tooBig++
        return null
      }
      data = small
      mime = 'image/jpeg'
    }
    if (images.length >= MAX_RAW_IMAGES || total + data.length > MAX_RAW_BYTES) {
      overLimit++
      return null
    }
    total += data.length
    images.push(`data:${mime};base64,${data.toString('base64')}`)
    byTarget.set(target, images.length - 1)
    return images.length - 1
  }
  const parts: string[] = []
  let last = 0
  const found = [...xmlBlocks(xml, 'w:drawing'), ...xmlBlocks(xml, 'w:pict')].toSorted(
    (a, b) => a.start - b.start,
  )
  for (const m of found) {
    if (m.start < last) continue // nested inside the previous block
    parts.push(xml.slice(last, m.start))
    last = m.end
    const el = m.el
    if (el.includes('<w:txbxContent')) {
      parts.push(el)
      continue
    } // text box: left for mammoth to read
    const rid = attr(openTag(el, 'a:blip'), 'r:embed') || attr(openTag(el, 'v:imagedata'), 'r:id')
    if (!rid) {
      parts.push(el)
      continue
    }
    const extTag = openTag(el, 'wp:extent')
    const cx = attr(extTag, 'cx')
    const cy = attr(extTag, 'cy')
    const ext = cx && cy && /^\d+$/.test(cx) && /^\d+$/.test(cy) ? [extTag, cx, cy] : null
    const pt = (attr(openTag(el, 'v:shape'), 'style') ?? '').match(
      /width:([\d.]+)pt;\s*height:([\d.]+)pt/,
    )
    const [w, h] = ext
      ? [Number(ext[1]), Number(ext[2])]
      : pt
        ? [Number(pt[1]) * 12_700, Number(pt[2]) * 12_700]
        : [Infinity, Infinity]
    // drop decorative images: both sides small (icon) or one side thin like a rule line; a text strip ~13px high but wide is kept
    if (Math.max(w, h) < MIN_IMAGE_EMU || Math.min(w, h) < MIN_LINE_EMU) continue
    const idx = await resolve(rid)
    if (idx !== null) parts.push(`<w:t>${IMG_ON}${idx}${IMG_OFF}</w:t>`)
  }
  parts.push(xml.slice(last))
  const notes = [
    unsupported && `${unsupported} ảnh định dạng chưa hỗ trợ (EMF/WMF…) bị bỏ`,
    tooBig && `${tooBig} ảnh quá lớn bị bỏ`,
    overLimit && `${overLimit} ảnh vượt giới hạn (tối đa ${MAX_RAW_IMAGES} ảnh) bị bỏ`,
  ].filter(Boolean)
  return {
    xml: parts.join(''),
    images,
    warning: notes.length > 0 ? `${notes.join('; ')}.` : undefined,
  }
}

/** Preprocesses a .docx when `marks` is on: marks emphasised text and swaps images for position tokens. */
async function prepareDocx(
  data: Buffer,
): Promise<{ data: Buffer; images: string[]; warning?: string }> {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  const file = zip.file('word/document.xml')
  if (!file) return { data, images: [] }
  const marked = mapXmlBlocks(await file.async('string'), 'w:r', (run) => {
    const rPr = xmlBlocks(run, 'w:rPr').next().value?.el ?? ''
    if (!rPr || !isEmphasised(rPr)) return run
    return mapXmlBlocks(run, 'w:t', (t, inner) =>
      /\S/.test(inner) && !inner.includes('<')
        ? `${t.slice(0, t.length - inner.length - 6)}${EMPH_ON}${inner}${EMPH_OFF}</w:t>`
        : t,
    )
  })
  const { xml, images, warning } = await tokenizeImages(zip, marked)
  zip.file('word/document.xml', xml)
  return { data: await zip.generateAsync({ type: 'nodebuffer' }), images, warning }
}

/**
 * mammoth's XML reader slows down quadratically on files with many unclosed tags (1 KB takes tens of seconds).
 * Scan the tag nesting depth of every XML part in linear time before handing the file to mammoth.
 */
const MAX_XML_DEPTH = 200
// Tag counts: a few KB of deflated parts expand to tens of thousands of paragraphs and the parser takes
// hundreds of MB; real documents are far below
const MAX_XML_TAGS_PART = 400_000
const MAX_XML_TAGS_TOTAL = 800_000
export async function assertSaneDocxXml(data: Buffer) {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  let tags = 0
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue
    const entry = zip.files[name]
    if (!entry) continue
    const xml = await entry.async('string')
    let depth = 0
    let partTags = 0
    for (let i = xml.indexOf('<'); i >= 0; i = xml.indexOf('<', i + 1)) {
      const c = xml[i + 1]
      if (c === '?' || c === '!') continue
      if (++partTags > MAX_XML_TAGS_PART || ++tags > MAX_XML_TAGS_TOTAL) {
        throw new Error('Tệp có cấu trúc bất thường, không đọc được.')
      }
      if (c === '/') {
        depth--
        continue
      }
      const gt = xml.indexOf('>', i)
      if (gt < 0) throw new Error('Tệp Word hỏng.')
      if (xml[gt - 1] !== '/') depth++
      if (depth > MAX_XML_DEPTH) throw new Error('Tệp Word có cấu trúc bất thường, không đọc được.')
      i = gt
    }
  }
}

export async function extractDocx(
  data: Buffer,
  marks = false,
): Promise<{ text: string; images: string[]; warning?: string }> {
  const mammoth = await import('mammoth')
  await assertSaneDocxXml(data)
  const prep = marks
    ? await prepareDocx(data)
    : { data, images: [] as string[], warning: undefined }
  const result = await mammoth.extractRawText({ buffer: prep.data })
  return { text: result.value, images: prep.images, warning: prep.warning }
}

/**
 * Image-only exams often split the question into many pieces (one image per line of text). Image tokens that follow
 * each other (separated only by whitespace or newlines) are stitched into ONE image: same line side by side, new line stacked.
 * Without @napi-rs/canvas the pieces stay as they are (the parser keeps the first piece and counts the rest).
 */
export async function stitchRuns(
  text: string,
  images: string[],
): Promise<{ text: string; images: string[] }> {
  let canvasMod: typeof import('@napi-rs/canvas')
  try {
    canvasMod = await import('@napi-rs/canvas')
  } catch {
    return { text, images }
  }
  const { createCanvas, loadImage } = canvasMod
  const tok = `${IMG_ON}\\d+${IMG_OFF}`
  const run = new RegExp(`${tok}(?:[ \\t\\u00a0\\n]*${tok})+`, 'g')
  const out = [...images]
  const loaded = new Map<number, Awaited<ReturnType<typeof loadImage>>>()
  const load = async (i: number) => {
    const image = images[i] ?? ''
    if (!loaded.has(i))
      loaded.set(i, await loadImage(Buffer.from(image.slice(image.indexOf(',') + 1), 'base64')))
    return loaded.get(i)!
  }
  const layoutRows = async (items: { before: string; idx: number }[]) => {
    const rows: Awaited<ReturnType<typeof load>>[][] = []
    for (const item of items) {
      const img = await load(item.idx)
      if (rows.length === 0 || item.before.includes('\n')) rows.push([img])
      else rows.at(-1)?.push(img)
    }
    return rows
  }
  const cache = new Map<string, string>()
  const pieces: { before: string; idx: number }[] = []
  let result = ''
  let last = 0
  for (const m of text.matchAll(run)) {
    result += text.slice(last, m.index)
    last = m.index! + m[0].length
    pieces.length = 0
    let gap = ''
    for (const part of m[0].split(new RegExp(`(${tok})`)).filter((x) => x !== '')) {
      const t = part.match(new RegExp(`^${IMG_ON}(\\d+)${IMG_OFF}$`))
      if (t) {
        pieces.push({ before: gap, idx: Number(t[1]) })
        gap = ''
      } else gap += part
    }
    const key = pieces.map((p) => `${p.before.includes('\n') ? '|' : ','}${p.idx}`).join('')
    if (!cache.has(key)) {
      try {
        const rows = await layoutRows(pieces)
        const rowW = rows.map((r) => r.reduce((n, i) => n + i.width, 0))
        const rowH = rows.map((r) => Math.max(...r.map((i) => i.height)))
        const W = Math.max(...rowW)
        const H = rowH.reduce((n, h) => n + h, 0)
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        let y = 0
        rows.forEach((r, ri) => {
          let x = 0
          const height = rowH[ri] ?? 0
          for (const img of r) {
            ctx.drawImage(img, x, y + (height - img.height) / 2)
            x += img.width
          }
          y += height
        })
        let buf = canvas.toBuffer('image/png')
        let mime = 'image/png'
        if (buf.length > MAX_IMAGE_BYTES) {
          buf = canvas.toBuffer('image/jpeg', 82)
          mime = 'image/jpeg'
        }
        out.push(`data:${mime};base64,${buf.toString('base64')}`)
        cache.set(key, `${IMG_ON}${out.length - 1}${IMG_OFF}`)
      } catch {
        cache.set(key, m[0])
      }
    }
    result += cache.get(key)
  }
  return { text: result + text.slice(last), images: out }
}

/** After the text is cut: drops images no token refers to and renumbers the rest. */
export function compactImages(text: string, images: string[]): { text: string; images: string[] } {
  const map = new Map<number, number>()
  const out: string[] = []
  const next = text.replaceAll(new RegExp(`${IMG_ON}(\\d+)${IMG_OFF}`, 'g'), (_, n: string) => {
    const old = Number(n)
    if (!map.has(old)) {
      map.set(old, out.length)
      out.push(images[old] ?? '')
    }
    return `${IMG_ON}${map.get(old)}${IMG_OFF}`
  })
  return { text: next, images: out }
}

/** Final limit: at most MAX_IMAGES images and MAX_TOTAL_IMAGE_BYTES bytes; tokens of dropped images are removed from the text. */
export function capImages(
  text: string,
  images: string[],
): { text: string; images: string[]; dropped: number } {
  let total = 0
  let keep = 0
  while (
    keep < images.length &&
    keep < MAX_IMAGES &&
    total + (images[keep]?.length ?? 0) * 0.75 <= MAX_TOTAL_IMAGE_BYTES
  )
    total += (images[keep++]?.length ?? 0) * 0.75
  if (keep === images.length) return { text, images, dropped: 0 }
  const next = text.replaceAll(new RegExp(`${IMG_ON}(\\d+)${IMG_OFF}`, 'g'), (t, n: string) =>
    Number(n) < keep ? t : '',
  )
  return { text: next, images: images.slice(0, keep), dropped: images.length - keep }
}
