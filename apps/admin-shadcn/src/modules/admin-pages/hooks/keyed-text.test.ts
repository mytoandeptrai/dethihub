import { describe, expect, it } from 'vitest'

import { keyedText } from './keyed-text'

describe('keyed text', () => {
  it('handles empty content', () => expect(keyedText([])).toEqual([]))
  it('keeps repeated lines distinct while preserving their text', () => {
    const result = keyedText(['a', 'a', 'b'])
    expect(result.map((item) => item.value)).toEqual(['a', 'a', 'b'])
    expect(new Set(result.map((item) => item.key)).size).toBe(3)
  })
  it('preserves keys when distinct lines move', () => {
    const before = keyedText(['a', 'b'])
    expect(keyedText(['b', 'a'])).toEqual([before[1], before[0]])
  })
})
