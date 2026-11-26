import { describe, expect, it } from 'vitest'

import { parseEventStream } from './ai-stream'

const read = async (chunks: string[]) => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return Array.fromAsync(parseEventStream(stream))
}

describe('ai event stream', () => {
  it('parses chunk boundaries, comments, CRLF, multiline data and DONE', async () => {
    const events = await read([
      ':ping\r\ndata: xin ',
      'chào\r\ndata: dòng hai\r\n',
      '\r\nevent: quota\nid: 2\ndata: {}\n\ndata: [DONE]\n\ndata: ignored\n\n',
    ])
    expect(events.map(({ data, event, id }) => ({ data, event, id }))).toEqual([
      { data: 'xin chào\ndòng hai', event: undefined, id: undefined },
      { data: '{}', event: 'quota', id: '2' },
    ])
  })

  it('accepts an empty stream', async () => {
    await expect(read([])).resolves.toEqual([])
  })

  it('finishes DONE without waiting for another tee consumer to cancel', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      },
    })
    const [left, right] = stream.tee()
    await expect(Array.fromAsync(parseEventStream(left))).resolves.toEqual([])
    await right.cancel()
  })

  it('propagates reader errors', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('broken'))
      },
    })
    await expect(Array.fromAsync(parseEventStream(stream))).rejects.toThrow('broken')
  })
})
