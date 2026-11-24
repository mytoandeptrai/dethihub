import { describe, expect, it } from 'vitest'

import { readStream } from '@/modules/ai/infrastructure/adapters/chat-completion-stream'

const delta = 'data: {"choices":[{"delta":{"content":"Answer"}}]}\n\n'

describe('chat completion stream', () => {
  it('reads the OpenRouter reasoning alias without doubling gateways that send both fields', async () => {
    const response = new Response(': keep-alive\n\ndata: ' + JSON.stringify({ choices: [{ delta: { reasoning: 'First' } }] }) + '\n\ndata: ' + JSON.stringify({ choices: [{ delta: { reasoning: 'Second', reasoning_content: 'Second' } }] }) + '\n\n' + delta + 'data: [DONE]\n\n')
    const received: string[] = []
    const result = await readStream(response, (chunk) => received.push(chunk.reasoning))
    expect(result.reasoning).toBe('FirstSecond')
    expect(received).toEqual(['First', 'Second', ''])
    expect(result.content).toBe('Answer')
    expect(result.broken).toBeUndefined()
  })

  it.each(['data: [DONE]\n\n', 'data: {"choices":[{"finish_reason":"stop"}]}\n\n'])(
    'accepts an explicitly completed answer: %s',
    async (ending) => {
      const received: string[] = []
      const result = await readStream(new Response(delta + ending), (chunk) =>
        received.push(chunk.content),
      )
      expect(result.content).toBe('Answer')
      expect(result.broken).toBeUndefined()
      expect(received).toEqual(['Answer'])
    },
  )

  it('rejects a truncated SSE body even if the connection closes without a read error', async () => {
    expect(await readStream(new Response(delta), () => {})).toMatchObject({
      content: 'Answer',
      broken: true,
    })
  })

  it('reports provider error events and missing bodies as broken', async () => {
    expect(
      await readStream(new Response('data: {"error":{"message":"overloaded"}}\n\n'), () => {}),
    ).toMatchObject({ content: '', broken: true })
    expect(await readStream(new Response(null), () => {})).toMatchObject({
      content: '',
      broken: true,
    })
  })

  it('does not accept an SSE error followed by DONE as a successful partial answer', async () => {
    const response = new Response(
      delta + 'data: {"error":{"message":"overloaded"}}\n\ndata: [DONE]\n\n',
    )
    expect(await readStream(response, () => {})).toMatchObject({ content: 'Answer', broken: true })
  })
})
