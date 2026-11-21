import type { Question } from './types.js'

const TF_RATIO = [0, 0.1, 0.25, 0.5, 1]

export const SHORT_MAX_CHARS = 4

export function parseTrueFalse(raw: string | undefined, n: number): boolean[] | null {
  if (!raw) return null
  const letters = raw
    .toUpperCase()
    .replaceAll('ĐÚNG', 'Đ')
    .replaceAll('SAI', 'S')
    .replaceAll(/[^ĐS]/g, '')
  if (letters.length !== n) return null
  return [...letters].map((c) => c === 'Đ')
}

export function formatTrueFalse(values: (boolean | null)[]): string {
  return values.map((v) => (v === null ? '_' : v ? 'Đ' : 'S')).join('')
}

export function readTrueFalseAnswer(given: string | undefined, n: number): (boolean | null)[] {
  const chars = [...(given ?? '')].filter((c) => c === 'Đ' || c === 'S' || c === '_')
  return Array.from({ length: n }, (_, i) =>
    chars[i] === 'Đ' ? true : chars[i] === 'S' ? false : null,
  )
}

export function normalizeShort(raw: string | undefined): string {
  return (raw ?? '').trim().replaceAll(/\s+/g, '').replaceAll('.', ',').replace(/^\+/, '')
}

export function sameShort(a: string | undefined, b: string | undefined): boolean {
  const x = normalizeShort(a)
  const y = normalizeShort(b)

  if (!/\d/.test(x) || !/\d/.test(y)) return false
  const nx = Number(x.replace(',', '.'))
  const ny = Number(y.replace(',', '.'))
  if (Number.isFinite(nx) && Number.isFinite(ny)) return Math.abs(nx - ny) < 1e-9
  return x.toLowerCase() === y.toLowerCase()
}

export function scoreQuestion(q: Question, given: string | undefined): number {
  if (!given) return 0
  switch (q.type) {
    case 'trac-nghiem':
      return given === q.answer ? q.points : 0
    case 'dung-sai': {
      const n = q.options?.length ?? 0
      const key = parseTrueFalse(q.answer, n)
      if (!key) return 0
      const got = readTrueFalseAnswer(given, n)
      const right = key.filter((k, i) => got[i] === k).length
      const ratio = n === 4 ? (TF_RATIO[right] ?? 0) : n ? right / n : 0
      return Math.round(ratio * q.points * 1000) / 1000
    }
    case 'tra-loi-ngan':
      return sameShort(given, q.answer) ? q.points : 0
    default:
      return 0
  }
}

export function isFullyCorrect(q: Question, given: string | undefined): boolean {
  return q.points > 0 && scoreQuestion(q, given) >= q.points
}

export function isAutoGraded(q: Question): boolean {
  if (q.type === 'trac-nghiem' || q.type === 'tra-loi-ngan') return Boolean(q.answer)
  if (q.type === 'dung-sai') return parseTrueFalse(q.answer, q.options?.length ?? 0) !== null
  return false
}

export function gradableMax(qs: Question[]): number {
  return Math.round(qs.reduce((n, q) => n + (isAutoGraded(q) ? q.points : 0), 0) * 1000) / 1000
}

export function missingKeyCount(qs: Question[]): number {
  return qs.filter(
    (q) =>
      (q.type === 'trac-nghiem' || q.type === 'tra-loi-ngan' || q.type === 'dung-sai') &&
      !isAutoGraded(q),
  ).length
}

export function describeAnswer(q: Question, raw: string | undefined): string {
  if (!raw) return ''
  if (q.type === 'dung-sai') {
    const n = q.options?.length ?? 0
    return readTrueFalseAnswer(raw, n)
      .map(
        (v, i) =>
          `${q.options?.[i]?.key ?? String.fromCodePoint(97 + i)}) ${v === null ? '—' : v ? 'Đúng' : 'Sai'}`,
      )
      .join(' · ')
  }
  return raw
}
