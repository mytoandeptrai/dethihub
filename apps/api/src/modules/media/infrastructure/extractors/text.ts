export const MAX_TEXT = 60_000
export const MAX_ROWS = 200
export const MAX_COLS = 20
export function clean(text: string): string {
  return text
    .replaceAll('\r', '')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .replaceAll(/[ \t]{2,}/g, ' ')
    .trim()
}

export function capped(text: string, warning?: string): { text: string; warning?: string } {
  const t = clean(text)
  if (t.length <= MAX_TEXT) return { text: t, warning }
  return { text: t.slice(0, MAX_TEXT), warning: 'Tệp dài; chỉ đọc phần đầu.' }
}

/** Private-use characters that wrap emphasised text (bold, italic, underline, strike, colour, highlight): U+E000 opens, U+E001 closes. */
export const EMPH_ON = '\uE000'
export const EMPH_OFF = '\uE001'
