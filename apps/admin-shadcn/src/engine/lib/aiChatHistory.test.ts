import { describe, expect, it } from 'vitest'

import { decodeChatHistory, encodeChatHistory } from './aiChatHistory'

import type { ChatTurn } from '../examEditor/AiPanel'

describe('incomplete chat history', () => {
  it('roundtrips the incomplete state and the exact refund-aware retry request', () => {
    const turn: ChatTurn = {
      id: 'a1',
      role: 'assistant',
      text: '',
      incomplete: true,
      aiRequest: {
        body: {
          task: 'soan-de',
          messages: [{ role: 'user', content: 'Soạn đề 2 câu' }],
          maxTokens: 32000,
        },
        total: 2,
      },
      generation: {
        busy: false,
        stopped: false,
        questions: [],
        blocks: [],
        text: '{"action":"rep',
        receipt: 'cut-off-receipt',
      },
    }
    const [restored] = decodeChatHistory(encodeChatHistory([turn]))
    expect(restored?.incomplete).toBe(true)
    expect(restored?.aiRequest).toEqual({ ...turn.aiRequest, retryOf: 'cut-off-receipt' })
  })

  it('leaves old histories without the flag unchanged', () => {
    const [restored] = decodeChatHistory(
      '[{"id":"old","role":"assistant","text":"Lời giải trước đây"}]',
    )
    expect(restored).toMatchObject({ id: 'old', role: 'assistant', text: 'Lời giải trước đây' })
    expect(restored).not.toHaveProperty('incomplete')
    expect(restored).not.toHaveProperty('aiRequest')
  })

  it('rejects malformed retry metadata without discarding a saved answer', () => {
    const [restored] = decodeChatHistory(
      '[{"id":"a","role":"assistant","text":"Đã tạo","incomplete":true,"aiRequest":{"body":{"messages":"bad"}}}]',
    )
    expect(restored?.text).toBe('Đã tạo')
    expect(restored?.incomplete).toBe(true)
    expect(restored?.aiRequest).toBeUndefined()
    expect(decodeChatHistory('invalid')).toEqual([])
    expect(decodeChatHistory('[]')).toEqual([])
  })
})
