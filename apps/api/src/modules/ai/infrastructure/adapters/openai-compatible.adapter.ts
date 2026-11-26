import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { LlmUpstreamError } from '@/modules/ai/domain/provider-chain'
import { readStream } from '@/modules/ai/infrastructure/adapters/chat-completion-stream'

import type {
  Citation,
  LlmProviderPort,
  LlmRequest,
  LlmResult,
} from '@/modules/ai/application/ports/llm-provider.port'
import type { ChatMessage } from '@/modules/ai/domain/billing'
import type { Completion } from '@/modules/ai/infrastructure/adapters/chat-completion-stream'

function citationsOf(
  annotations: NonNullable<NonNullable<Completion['choices']>[number]['message']>['annotations'],
): Citation[] {
  const byUrl = new Map<string, Citation>()
  for (const annotation of annotations ?? []) {
    const url = annotation.url_citation?.url
    if (annotation.type === 'url_citation' && url && !byUrl.has(url)) {
      byUrl.set(url, { url, title: annotation.url_citation?.title || url })
    }
  }
  return [...byUrl.values()].slice(0, 20)
}

function withImages(messages: ChatMessage[], images: string[]): unknown[] {
  const last = messages.length - 1
  return messages.map((message, index) =>
    index === last
      ? {
          role: message.role,
          content: [
            { type: 'text', text: message.content },
            ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        }
      : message,
  )
}

@Injectable()
export class OpenAiCompatibleAdapter implements LlmProviderPort {
  /** the opencode gateway routes and caches by this header and rejects calls without it */
  readonly #sessionId = randomUUID()

  async complete(request: LlmRequest): Promise<LlmResult> {
    const { target } = request
    const opencode = target.provider === 'opencode'

    const response = await fetch(`${target.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${target.apiKey}`,
        ...(opencode ? { 'x-opencode-session': this.#sessionId } : {}),
      },
      body: JSON.stringify({
        model: target.model,
        messages: request.images?.length
          ? withImages(request.messages, request.images)
          : request.messages,
        max_tokens: request.maxTokens,
        ...((opencode || target.effort) && request.reasoningEffort
          ? { reasoning_effort: request.reasoningEffort }
          : {}),
        ...(target.search
          ? { tools: [{ type: 'deepseek_web_search' }], thinking: { type: 'disabled' } }
          : {}),
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
        ...(target.stream || request.stream
          ? { stream: true, stream_options: { include_usage: true } }
          : {}),
      }),
      redirect: 'error',
      signal: AbortSignal.any([
        AbortSignal.timeout(request.timeoutMs),
        ...(request.signal ? [request.signal] : []),
      ]),
    })

    if (!response.ok) {
      await response.text().catch(() => '')
      throw new LlmUpstreamError(response.status)
    }

    if (request.stream || target.stream) {
      request.stream?.onOpen()
      return readStream(response, (delta) => {
        if (delta.content.trim()) request.onFirstAnswer?.()
        request.stream?.onDelta(delta)
      })
    }

    const text = await response.text()
    let data: Completion
    try {
      data = JSON.parse(text) as Completion
    } catch {
      throw new Error('upstream returned non-JSON body')
    }
    const choice = data.choices?.[0]
    if (choice?.message?.content?.trim()) request.onFirstAnswer?.()
    return {
      content: choice?.message?.content ?? '',
      reasoning: choice?.message?.reasoning_content ?? '',
      usage: data.usage,
      finishReason: choice?.finish_reason ?? 'unknown',
      ...(target.search ? { citations: citationsOf(choice?.message?.annotations) } : {}),
    }
  }
}
