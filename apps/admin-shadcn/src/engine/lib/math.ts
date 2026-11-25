import katex from 'katex'
import 'katex/contrib/mhchem' // \ce{...} cho phương trình hoá học
import 'katex/dist/katex.min.css'
import { renderRichText } from './rich-text-html'
export { escapeHtml } from './rich-text-html'
export { formatPoints, plainText } from './mathText'

/**
 * Render a string that may contain `$...$` inline math and `$$...$$` display math.
 * Returns HTML with katex markup already rendered.
 */
export function renderMath(input: string): string {
  return renderRichText(input, (body, display) =>
    katex.renderToString(body.trim(), {
      displayMode: display,
      throwOnError: false,
      output: 'html',
      strict: false,
      trust: false,
    }),
  )
}

/** Vietnamese-friendly number formatting for the UI (1.234,5). */
export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}
