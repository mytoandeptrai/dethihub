import { describe, expect, it } from 'vitest'

import { metadata } from './layout'

describe('editor crawler metadata', () => {
  it('keeps the private editor out of search', () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
  })
})
