import { describe, expect, it, vi } from 'vitest'

import { AnthropicAdapter } from '@/modules/ai/infrastructure/adapters/anthropic.adapter'

import type { LlmRequest } from '@/modules/ai/application/ports/llm-provider.port'

const { createStream } = vi.hoisted(() => ({ createStream: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    beta = { messages: { stream: createStream } }
  },
}))

describe('anthropic first answer', () => {
  it.each(['', '   ', 'answer text'])(
    'notifies the deadline only for non-whitespace answer text (%s)',
    async (text) => {
      const onFirstAnswer = vi.fn()
      const signal = new AbortController().signal
      const stream = {
        on: vi.fn((_event: string, listener: (delta: string) => void) => {
          listener(text)
        }),
        finalMessage: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'answer text' }],
          usage: { input_tokens: 10, output_tokens: 20 },
          stop_reason: 'end_turn',
        }),
      }
      createStream.mockReturnValue(stream)
      const request: LlmRequest = {
        target: {
          provider: 'anthropic',
          apiKey: 'key',
          baseUrl: 'https://example.com',
          model: 'test',
        },
        messages: [{ role: 'user', content: 'question' }],
        maxTokens: 256,
        timeoutMs: 250_000,
        signal,
        onFirstAnswer,
      }
      expect((await new AnthropicAdapter().complete(request)).content).toBe('answer text')
      expect(onFirstAnswer).toHaveBeenCalledTimes(text.trim() ? 1 : 0)
      expect(createStream.mock.calls.at(-1)?.[1].signal).toBeInstanceOf(AbortSignal)
    },
  )
})
