import { JSONParser } from '@streamparser/json'

export interface GeneratedQuestion {
  id: string
  number: number
  prompt: string
  raw: Record<string, unknown>
}

export function questionText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => questionText(item)).join('')
  if (value && typeof value === 'object') {
    const span = value as Record<string, unknown>
    if (typeof span.math === 'string') return `$${span.math}$`
    return questionText(span.text ?? span.math)
  }
  return ''
}

function jsonStringRepair() {
  let inString = false
  let inMath = false
  let pending = ''

  return (chunk: string, final = false): string => {
    const input = pending + chunk
    pending = ''
    let output = ''
    for (let index = 0; index < input.length; index++) {
      const char = input[index]!
      if (inString && char === '\\') {
        const next = input[index + 1]
        if (!final && (!next || next === 'u' && input.length < index + 6 || inMath && /[bfr]/.test(next) && input.length < index + 3)) {
          pending = input.slice(index)
          break
        }
        const mathCommand = inMath && /[bfr]/.test(next ?? '') && /[a-z]/i.test(input[index + 2] ?? '')
        const invalidEscape = next === 'u' ? !/^[\da-f]{4}$/i.test(input.slice(index + 2, index + 6)) : !/["\\/bfnrt]/.test(next ?? '')
        output += (next && (invalidEscape || mathCommand) ? '\\\\' : '\\') + (next ?? '')
        index++
      } else {
        if (char === '"') { inString = !inString; inMath = false }
        else if (inString && char === '$') inMath = !inMath
        output += inString && char === '\n' ? '\\n' : inString && char === '\r' ? '\\r' : inString && char === '\t' ? '\\t' : char
      }
    }
    return output
  }
}

export function parseAiDocumentReply(content: string, parse: (json: string) => unknown = JSON.parse): Record<string, unknown> | null {
  const first = content.indexOf('{')
  const last = content.lastIndexOf('}')
  if (first < 0 || last < first) return null
  try {
    const value: unknown = parse(jsonStringRepair()(content.slice(first, last + 1), true))
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch { return null }
}

export class QuestionStreamParser {
  readonly questions: GeneratedQuestion[] = []
  readonly blocks: Record<string, unknown>[] = []
  readonly #parser = new JSONParser({ paths: ['$.blocks.*', '$.questions.*'] })
  readonly #repair = jsonStringRepair()
  #source = ''
  #started = false
  #failed = false

  constructor() {
    this.#parser.onValue = ({ value, key, stack }) => {
      if (!value || typeof value !== 'object' || Array.isArray(value) || typeof key !== 'number') return
      const source = stack.at(-1)?.key
      const raw = value as Record<string, unknown>
      if (source === 'blocks') this.blocks.push(raw)
      if (source !== 'questions' && !(source === 'blocks' && (raw.type === 'question' || raw.type === 'essay'))) return
      const prompt = questionText(raw.prompt ?? raw.text).trim()
      if (!prompt) return
      this.questions.push({ id: `${source}:${key}`, number: Number(raw.no ?? raw.number) || this.questions.length + 1, prompt, raw })
    }
  }

  push(chunk: string): void {
    this.#source += chunk
    if (this.#failed || this.#parser.isEnded) return
    if (!this.#started) {
      const start = chunk.indexOf('{')
      if (start < 0) return
      chunk = chunk.slice(start)
      this.#started = true
    }
    try { this.#parser.write(this.#repair(chunk)) } catch { this.#failed = true }
  }

  finish(): void {
    const reply = parseAiDocumentReply(this.#source)
    if (!reply) return
    const parser = new QuestionStreamParser()
    parser.push(JSON.stringify(reply))
    this.questions.splice(0, this.questions.length, ...parser.questions)
    this.blocks.splice(0, this.blocks.length, ...parser.blocks)
  }
}

export function selectedExamPayload(questions: readonly GeneratedQuestion[], blocks: readonly Record<string, unknown>[]): string {
  const numbers = new Set(questions.map((question) => question.number))
  const answers = blocks.filter((block) => block.type === 'answerKey').flatMap((block) =>
    Array.isArray(block.items) ? block.items.filter((item: unknown) => !!item && typeof item === 'object' && numbers.has(Number((item as Record<string, unknown>).no))) : [],
  )
  return JSON.stringify({ action: 'append', blocks: [...questions.map((question) => question.raw), ...(answers.length > 0 ? [{ type: 'answerKey', items: answers }] : [])] })
}
