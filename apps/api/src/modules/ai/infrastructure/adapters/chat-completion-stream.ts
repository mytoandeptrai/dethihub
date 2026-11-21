import type { LlmResult } from '@/modules/ai/application/ports/llm-provider.port'
import type { Usage } from '@/modules/ai/domain/billing'

export interface Completion {
  usage?: Usage
  choices?: {
    finish_reason?: string
    message?: {
      content?: string
      reasoning_content?: string
      annotations?: { type?: string; url_citation?: { url?: string; title?: string } }[]
    }
    delta?: { content?: string; reasoning_content?: string }
  }[]
}

export type Delta = { content: string; reasoning: string }

/** Folds the `data: {...}` lines of a streamed chat/completions into one answer */
export class StreamFold {
  content = ''
  reasoning = ''
  finish: string | undefined
  usage: Usage | undefined

  /** returns the text this line added, if any */
  push(line: string): Delta | null {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:') || trimmed === 'data: [DONE]') return null
    try {
      const chunk = JSON.parse(trimmed.slice(5)) as Completion
      const choice = chunk.choices?.[0]
      const delta = {
        content: choice?.delta?.content ?? '',
        reasoning: choice?.delta?.reasoning_content ?? '',
      }
      this.content += delta.content
      this.reasoning += delta.reasoning
      this.finish = choice?.finish_reason ?? this.finish
      this.usage = chunk.usage ?? this.usage
      return delta.content || delta.reasoning ? delta : null
    } catch {
      return null
    }
  }

  result(broken = false): LlmResult {
    return {
      content: this.content,
      reasoning: this.reasoning,
      usage: this.usage,
      finishReason: this.finish ?? 'unknown',
      ...(broken ? { broken } : {}),
    }
  }
}

/** Reads the SSE body piece by piece. Never throws: a stream that dies midway is reported as broken with what arrived */
export async function readStream(
  response: Response,
  onDelta: (delta: Delta) => void,
): Promise<LlmResult> {
  const fold = new StreamFold()
  const reader = response.body?.getReader()
  if (!reader) return fold.result(true)

  const decoder = new TextDecoder()
  const eat = (line: string) => {
    const delta = fold.push(line)
    if (delta) onDelta(delta)
  }
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        eat(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
      }
    }
    if (buffer) eat(buffer)
  } catch {
    return fold.result(true)
  }
  return fold.result()
}
