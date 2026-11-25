import { describe, expect, it } from 'vitest'

import {
  resolveFeatures,
  sanitizeSetting,
} from '@/modules/app-settings/domain/policies/settings.policy'

const enabled = { word: true, slide: true, board: true, online: true }

describe('feature settings', () => {
  it('accepts a complete boolean object', () => {
    expect(sanitizeSetting('features', { ...enabled, word: false })).toEqual({
      ...enabled,
      word: false,
    })
  })
  it.each([
    null,
    [],
    'true',
    { ...enabled, extra: true },
    { ...enabled, word: 1 },
    { ...enabled, slide: 'false' },
    {},
  ])('rejects malformed writes: %j', (value) => {
    expect(() => sanitizeSetting('features', value as never)).toThrow()
  })
  it('defaults absent and partial stored flags individually', () => {
    expect(resolveFeatures(undefined)).toEqual(enabled)
    expect(resolveFeatures({ word: false })).toEqual({ ...enabled, word: false })
  })
})
