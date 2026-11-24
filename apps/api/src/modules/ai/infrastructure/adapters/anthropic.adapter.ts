import Anthropic from '@anthropic-ai/sdk'
import { Injectable } from '@nestjs/common'

import type {
  LlmProviderPort,
  LlmRequest,
  LlmResult,
} from '@/modules/ai/application/ports/llm-provider.port'

const DATA_URL = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/

function imageBlocks(images: string[]): Anthropic.Beta.BetaImageBlockParam[] {
  const blocks: Anthropic.Beta.BetaImageBlockParam[] = []
  for (const url of images) {
    const match = DATA_URL.exec(url)
    if (!match) continue
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        data: match[2] ?? '',
      },
    })
  }
  return blocks
}

@Injectable()
export class AnthropicAdapter implements LlmProviderPort {
  readonly #clients = new Map<string, Anthropic>()

  async complete(request: LlmRequest): Promise<LlmResult> {
    const { target } = request

    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')
    const messages: Anthropic.Beta.BetaMessageParam[] = request.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    // the Messages API does not accept a trailing assistant turn
    while (messages.at(-1)?.role === 'assistant') messages.pop()
    if (messages.length === 0) throw new Error('no user message')
    const lastMessage = messages.at(-1)
    if (request.images?.length && lastMessage && typeof lastMessage.content === 'string') {
      lastMessage.content = [
        ...imageBlocks(request.images),
        { type: 'text', text: lastMessage.content },
      ]
    }

    // streaming + finalMessage(): a large max_tokens would otherwise hit the SDK's HTTP timeout
    const stream = this.#client(target.apiKey, target.baseUrl).beta.messages.stream(
      {
        model: target.model,
        max_tokens: request.maxTokens,
        ...(system ? { system } : {}),
        messages,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      },
      {
        signal: AbortSignal.any([
          AbortSignal.timeout(request.timeoutMs),
          ...(request.signal ? [request.signal] : []),
        ]),
      },
    )
    stream.on('text', (text) => {
      if (text.trim()) request.onFirstAnswer?.()
    })
    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') {
      throw new Error(`refused (${message.stop_details?.category ?? 'unknown'})`)
    }
    const input =
      message.usage.input_tokens +
      (message.usage.cache_read_input_tokens ?? 0) +
      (message.usage.cache_creation_input_tokens ?? 0)
    return {
      content: message.content.map((b) => (b.type === 'text' ? b.text : '')).join(''),
      reasoning: '',
      usage: {
        prompt_tokens: input,
        completion_tokens: message.usage.output_tokens,
        total_tokens: input + message.usage.output_tokens,
      },
      finishReason: message.stop_reason ?? 'unknown',
    }
  }

  #client(apiKey: string, baseURL: string): Anthropic {
    const id = `${apiKey}|${baseURL}`
    let client = this.#clients.get(id)
    if (!client) {
      client = new Anthropic({
        apiKey,
        baseURL,
        maxRetries: 1,
        fetchOptions: { redirect: 'error' },
      })
      this.#clients.set(id, client)
    }
    return client
  }
}
