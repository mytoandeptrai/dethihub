const TOKENS =
  /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|!\[[^\]\n]*\]\((?:https?:|data:image\/|\/)[^)\s]+\))/g

export function containsMath(input: string): boolean {
  return [...input.matchAll(TOKENS)].some(([token]) => token.startsWith('$'))
}

export function renderRichText(
  input: string,
  renderFormula?: (body: string, display: boolean) => string,
): string {
  if (!input) return ''
  const out: string[] = []
  let cursor = 0
  for (const match of input.matchAll(TOKENS)) {
    if (match.index > cursor) out.push(inlineMarks(escapeHtml(input.slice(cursor, match.index))))
    const raw = match[0]
    if (raw.startsWith('![')) {
      out.push(inlineImage(raw))
    } else {
      const display = raw.startsWith('$$')
      out.push(
        renderFormula
          ? renderFormula(display ? raw.slice(2, -2) : raw.slice(1, -1), display)
          : escapeHtml(raw),
      )
    }
    cursor = match.index + raw.length
  }
  if (cursor < input.length) out.push(inlineMarks(escapeHtml(input.slice(cursor))))
  return out.join('')
}

function inlineImage(raw: string): string {
  const match = /^!\[([^\]|]*)(?:\|([^\]]*))?\]\(([^)]+)\)$/.exec(raw)
  if (!match) return escapeHtml(raw)
  const pct = Number.parseInt(match[2] ?? '', 10)
  const width = pct >= 1 && pct <= 100 ? `width:${pct}%;` : 'max-width:min(100%,420px);'
  return `<img src="${escapeHtml(match[3])}" alt="${escapeHtml(match[1])}" loading="lazy" style="${width}height:auto;display:block;margin:6px 0;background:#fff;border-radius:6px">`
}

function inlineMarks(html: string): string {
  return html
    .replace(/\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([^_\n]+?)(?<=\S)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![*\w])/g, '$1<em>$2</em>')
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
