import { createParser } from 'eventsource-parser'

import { env } from '@/config/env'
import { t } from '@/i18n/translate'
import { authenticatedFetch } from '@/lib/api-client'
import { ApiClientError } from '@/lib/api-error'

import type { components } from '@workspace/api-types'
import type { EventSourceMessage } from 'eventsource-parser'

export async function* parseEventStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<EventSourceMessage> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const events: EventSourceMessage[] = []
  const parser = createParser({ onEvent: (event) => events.push(event) })
  try {
    for (;;) {
      const { value, done } = await reader.read()
      parser.feed(done ? decoder.decode() : decoder.decode(value, { stream: true }))
      for (const event of events.splice(0)) {
        if (event.data === '[DONE]') return
        yield event
      }
      if (done) return
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export async function* streamAiChat(
  body: components['schemas']['ChatRequestDto'],
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(env.NEXT_PUBLIC_API_URL + '/api/ai/chat', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({ ...body, stream: true }),
  })
  if (!response.body) throw new ApiClientError({ title: t('common.requestError'), status: 502 })
  yield* parseEventStream(response.body)
}
