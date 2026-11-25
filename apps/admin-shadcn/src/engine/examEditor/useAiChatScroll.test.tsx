import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAiChatScroll } from './useAiChatScroll'

let height = 900
let actionBottom = 720
let resize = () => {}

function Harness({ pending = false, actions = true, id = 'reply' }) {
  const { scrollRef, onScroll } = useAiChatScroll([{ id, pending }])
  return <div role="log" onScroll={onScroll} ref={(chat) => {
    scrollRef.current = chat
    if (!chat) return
    Object.defineProperties(chat, {
      scrollHeight: { configurable: true, get: () => height },
      clientHeight: { configurable: true, value: 300 },
    })
    chat.getBoundingClientRect = () => ({ top: 100, bottom: 400 }) as DOMRect
    const row = chat.querySelector('[data-ai-approval]')
    if (row) row.getBoundingClientRect = () => ({ bottom: 100 + actionBottom - chat.scrollTop }) as DOMRect
  }}><div>{actions ? <div data-ai-approval>Áp dụng</div> : null}</div></div>
}

beforeEach(() => {
  height = 900
  actionBottom = 720
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe() {}
    disconnect() {}
  })
})

describe('ai chat scrolling', () => {
  it('follows streaming content but aligns completed approval buttons rather than the content tail', () => {
    const { rerender } = render(<Harness pending />)
    const chat = screen.getByRole('log')
    expect(chat.scrollTop).toBe(600)
    rerender(<Harness />)
    expect(chat.scrollTop).toBe(420)
    act(() => { actionBottom = 760; resize() })
    expect(chat.scrollTop).toBe(460)
  })

  it('stops following when the reader scrolls up, including at completion, and resumes at the bottom', () => {
    const { rerender } = render(<Harness pending />)
    const chat = screen.getByRole('log')
    chat.scrollTop = 200
    fireEvent.scroll(chat)
    height = 1200
    rerender(<Harness pending />)
    expect(chat.scrollTop).toBe(200)
    rerender(<Harness />)
    expect(chat.scrollTop).toBe(200)
    chat.scrollTop = 900
    fireEvent.scroll(chat)
    height = 1500
    rerender(<Harness pending />)
    expect(chat.scrollTop).toBe(1200)
  })

  it.each([0, 10000])('clamps scrolling to the real content bounds for action offset %s', (offset) => {
    actionBottom = offset
    render(<Harness />)
    expect(screen.getByRole('log').scrollTop).toBe(offset === 0 ? 0 : 600)
  })

  it('handles empty content and follows normal chat without approval controls', () => {
    height = 0
    const { rerender } = render(<Harness actions={false} />)
    expect(screen.getByRole('log').scrollTop).toBe(0)
    height = 900
    rerender(<Harness actions={false} />)
    expect(screen.getByRole('log').scrollTop).toBe(600)
  })
})
