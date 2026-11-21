const tagEnd = (c: string | undefined) =>
  c === ' ' || c === '>' || c === '/' || c === '\t' || c === '\n' || c === '\r'

export function* xmlBlocks(
  xml: string,
  tag: string,
): Generator<{ start: number; end: number; el: string; inner: string }> {
  const open = `<${tag}`
  const close = `</${tag}>`
  let pos = 0
  while (pos < xml.length) {
    const i = xml.indexOf(open, pos)
    if (i < 0) return
    if (!tagEnd(xml[i + open.length])) {
      pos = i + open.length
      continue
    }
    const gt = xml.indexOf('>', i)
    if (gt < 0) return
    if (xml[gt - 1] === '/') {
      pos = gt + 1
      continue
    } // self-closing tag: no content
    const j = xml.indexOf(close, gt)
    if (j < 0) return
    const end = j + close.length
    yield { start: i, end, el: xml.slice(i, end), inner: xml.slice(gt + 1, j) }
    pos = end
  }
}

/** Replaces each `<tag>…</tag>` block with the result of `fn` (linear time). */
export function mapXmlBlocks(
  xml: string,
  tag: string,
  fn: (el: string, inner: string) => string,
): string {
  let out = ''
  let last = 0
  for (const b of xmlBlocks(xml, tag)) {
    out += xml.slice(last, b.start) + fn(b.el, b.inner)
    last = b.end
  }
  return out + xml.slice(last)
}

/** The first opening tag `<tag ...>` (only the part inside `<…>`), so attributes can be read with a short regex. */
export function openTag(xml: string, tag: string): string {
  let pos = 0
  for (;;) {
    const i = xml.indexOf(`<${tag}`, pos)
    if (i < 0) return ''
    const gt = xml.indexOf('>', i)
    if (gt < 0) return ''
    if (tagEnd(xml[i + tag.length + 1])) return xml.slice(i, gt + 1)
    pos = gt + 1
  }
}

/** Value of an attribute in an opening tag (a short tag, so the regex cannot backtrack). */
export const attr = (tag: string, name: string): string | undefined => {
  const exact = tag.indexOf(` ${name}="`)
  const at = exact === -1 ? tag.search(new RegExp(`\\s${name}="`)) : exact
  if (at < 0) return undefined
  const from = at + name.length + 3
  const to = tag.indexOf('"', from)
  return to < 0 ? undefined : tag.slice(from, to)
}
