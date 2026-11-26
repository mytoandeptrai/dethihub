import { describe, expect, it } from 'vitest'

import { clamp, revealStyle, slideMathHtml } from './slideViewHelpers'

describe('shared slide rendering helpers', () => {
  it('preserves clamping inside and outside the permitted interval', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(Number.NaN, 0, 10)).toBeNaN()
  })

  it('preserves the hidden animation poses and visible reset', () => {
    expect(revealStyle(false, 'spin', 300)).toMatchObject({
      opacity: 0,
      rotate: '-90deg',
      scale: '0.6',
    })
    expect(revealStyle(false, 'rise')).toMatchObject({ opacity: 0, translate: '0 2.4cqw' })
    expect(revealStyle(true)).toMatchObject({
      opacity: 1,
      translate: '0 0',
      scale: '1',
      rotate: '0deg',
    })
    expect(revealStyle(false).transition).toContain('450ms')
  })

  it('preserves empty text, bold text and math rendering', () => {
    expect(slideMathHtml('')).toBe('')
    expect(slideMathHtml('**Title**')).toContain('<strong>Title</strong>')
    expect(slideMathHtml('$\\frac{1}{2}$')).toContain('katex')
    expect(() => slideMathHtml('$\\invalidcommand{$')).not.toThrow()
  })
})
