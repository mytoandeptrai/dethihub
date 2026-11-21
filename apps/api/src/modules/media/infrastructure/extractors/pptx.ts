import { MAX_TEXT } from '@/modules/media/infrastructure/extractors/text'
import { xmlBlocks } from '@/modules/media/infrastructure/extractors/xml'

const MAX_CODE_POINT = 1_114_111 // 0x10FFFF
const fromCode = (code: number): string =>
  Number.isInteger(code) && code >= 0 && code <= MAX_CODE_POINT ? String.fromCodePoint(code) : ''

function decodeXml(text: string): string {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll(/&#(\d+);/g, (_, n: string) => fromCode(Number(n)))
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, n: string) => fromCode(parseInt(n, 16)))
    .replaceAll('&amp;', '&')
}

/**
 * Reads the text of each slide of a .pptx (zipped XML). Every `<a:p>` paragraph is one line;
 * the `<a:t>` runs of a paragraph are joined. Slides keep the order of their file numbers.
 */
export async function extractPptxSlides(data: Buffer): Promise<string[]> {
  const mod = await import('jszip')
  const JSZip: any = (mod as unknown as { default?: any }).default ?? mod
  const zip = await JSZip.loadAsync(data)
  const files = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .toSorted((a, b) => Number(a.match(/slide(\d+)/)![1]) - Number(b.match(/slide(\d+)/)![1]))

  const slides: string[] = []
  let budget = MAX_TEXT
  for (const name of files) {
    const entry = zip.files[name]
    if (!entry) continue
    const xml = await entry.async('string')
    const lines = (xml.split(/<\/a:p>/) as string[])
      .map((chunk: string) => [...xmlBlocks(chunk, 'a:t')].map((m) => decodeXml(m.inner)).join(''))
      .map((line: string) => line.trim())
      .filter(Boolean)
    const slide = lines.join('\n')
    if (!slide) continue
    if (slide.length > budget) {
      slides.push(slide.slice(0, Math.max(0, budget)))
      break
    }
    slides.push(slide)
    budget -= slide.length
    if (budget <= 0) break
  }
  return slides
}
