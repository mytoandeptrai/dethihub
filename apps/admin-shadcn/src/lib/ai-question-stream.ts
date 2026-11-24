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

export class QuestionStreamParser {
  readonly questions: GeneratedQuestion[] = []
  readonly blocks: Record<string, unknown>[] = []
  readonly #parser = new JSONParser({ paths: ['$.blocks.*', '$.questions.*'] })
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
    if (this.#failed || this.#parser.isEnded) return
    if (!this.#started) {
      const start = chunk.indexOf('{')
      if (start < 0) return
      chunk = chunk.slice(start)
      this.#started = true
    }
    try { this.#parser.write(chunk) } catch { this.#failed = true }
  }
}

export function selectedExamPayload(questions: readonly GeneratedQuestion[], blocks: readonly Record<string, unknown>[]): string {
  const numbers = new Set(questions.map((question) => question.number))
  const answers = blocks.filter((block) => block.type === 'answerKey').flatMap((block) =>
    Array.isArray(block.items) ? block.items.filter((item: unknown) => !!item && typeof item === 'object' && numbers.has(Number((item as Record<string, unknown>).no))) : [],
  )
  return JSON.stringify({ action: 'append', blocks: [...questions.map((question) => question.raw), ...(answers.length > 0 ? [{ type: 'answerKey', items: answers }] : [])] })
}
