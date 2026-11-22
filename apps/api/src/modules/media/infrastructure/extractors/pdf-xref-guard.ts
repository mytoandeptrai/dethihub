const MAX_XREF_ENTRIES = 500_000

// Regex pieces are composed from strings: the NUL byte is a legal PDF whitespace character
const WS = String.raw`\u0000\t\n\f\r `
const DELIMS = String.raw`<>()[\]{}/%`
const NAME_END = `${WS}${DELIMS}`

const TOKEN = new RegExp(
  String.raw`[${WS}]+|%[^\r\n]*|<<|>>|\/[^${NAME_END}]*|\\[\s\S]|[<>()[\]{}/]|[^${NAME_END}\\]+|\\`,
  'y',
)
const SPACE = new RegExp(String.raw`^[${WS}%]`)
const INDIRECT = new RegExp(
  String.raw`(?:[${WS}]|%[^\r\n]*)+\d+(?:[${WS}]|%[^\r\n]*)+R(?=$|[${NAME_END}])`,
  'y',
)
const headerPattern = () =>
  new RegExp(String.raw`(?<![^${NAME_END}])(?:obj|trailer)(?:[${WS}]|%[^\r\n]*)*<<`, 'g')

interface Scanner {
  raw: string
  cursor: number
}

interface Dictionary {
  size: number
  index: number
  isXref: boolean
  hasWidths: boolean
}

const decodeName = (name: string): string =>
  name.replaceAll(/#([\da-f]{2})/gi, (_, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  )

const integer = (token?: string): number =>
  token && /^[+-]?\d+(?:\.0*)?$/.test(token) ? Number(token) : Number.NaN

/** A PDF string can nest and escape parentheses and contain key-like characters */
function skipString(scanner: Scanner): void {
  let depth = 1
  while (scanner.cursor < scanner.raw.length && depth > 0) {
    const char = scanner.raw[scanner.cursor]
    if (char === '\\') scanner.cursor++
    else if (char === '(') depth++
    else if (char === ')') depth--
    scanner.cursor++
  }
}

function readToken(scanner: Scanner): string | undefined {
  TOKEN.lastIndex = scanner.cursor
  for (let match = TOKEN.exec(scanner.raw); match; match = TOKEN.exec(scanner.raw)) {
    scanner.cursor = TOKEN.lastIndex
    if (SPACE.test(match[0])) continue
    if (match[0] === '(') {
      skipString(scanner)
      return '('
    }
    return match[0]
  }
  return undefined
}

/** Consumes a nested `[`, `<<` or `<` value; counts `/Index` entries when asked */
function skipContainer(scanner: Scanner, countEntries: boolean) {
  let count = 0
  let items = 0
  let depth = 1
  for (let token = readToken(scanner); depth > 0 && token; token = readToken(scanner)) {
    if (token === '[' || token === '<<' || token === '<') {
      depth++
    } else if (token === ']' || token === '>>' || token === '>') {
      depth--
    } else if (countEntries && depth === 1) {
      const entry = integer(token)
      if (!Number.isSafeInteger(entry) || entry < 0) count = Number.POSITIVE_INFINITY
      else if (items % 2 === 1) count += entry
      items++
    }
    if (depth === 0) break
  }
  return { count, items, depth }
}

function readEntry(scanner: Scanner, key: string, dictionary: Dictionary): void {
  const value = readToken(scanner)
  if (key === '/Type' && value && decodeName(value) === '/XRef') dictionary.isXref = true
  if (key === '/W') dictionary.hasWidths = true
  const number = integer(value)
  INDIRECT.lastIndex = scanner.cursor
  const isReference = !Number.isNaN(number) && INDIRECT.test(scanner.raw)
  if (isReference) scanner.cursor = INDIRECT.lastIndex
  if (key === '/Size') {
    dictionary.size = Math.max(dictionary.size, isReference ? Number.POSITIVE_INFINITY : number)
  }
  if (key === '/Index' && value !== '[') dictionary.index = Number.POSITIVE_INFINITY
  if (value === '<' || value === '[' || value === '<<') {
    const countEntries = key === '/Index' && value === '['
    const nested = skipContainer(scanner, countEntries)
    if (countEntries) {
      dictionary.index = Math.max(
        dictionary.index,
        nested.items % 2 || nested.depth ? Number.POSITIVE_INFINITY : nested.count,
      )
    }
  }
}

/**
 * Reads the xref declarations on the raw bytes, before pdf.js can allocate per entry: a few bytes
 * declaring millions of entries would exhaust memory.
 */
export function assertSafePdfXref(data: Buffer): void {
  const scanner: Scanner = { raw: data.toString('latin1'), cursor: 0 }
  const header = headerPattern()
  // Also bounds the rescan work when stream bytes look like many nested dictionary heads
  let scanBudget = scanner.raw.length * 4
  for (let start = header.exec(scanner.raw); start; start = header.exec(scanner.raw)) {
    scanner.cursor = header.lastIndex
    const dictionary: Dictionary = {
      size: 0,
      index: 0,
      isXref: start[0].startsWith('trailer'),
      hasWidths: false,
    }
    for (let key = readToken(scanner); key?.startsWith('/'); key = readToken(scanner)) {
      readEntry(scanner, decodeName(key), dictionary)
    }
    const isXref = dictionary.isXref || (dictionary.hasWidths && readToken(scanner) === 'stream')
    scanBudget -= scanner.cursor - header.lastIndex
    const oversized =
      !Number.isSafeInteger(dictionary.size) ||
      dictionary.size > MAX_XREF_ENTRIES ||
      dictionary.index > MAX_XREF_ENTRIES
    if (scanBudget < 0 || (isXref && oversized)) {
      throw new Error('Tệp PDF có bảng tham chiếu bất thường, không đọc được.')
    }
  }
}
