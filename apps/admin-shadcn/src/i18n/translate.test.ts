import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import core from './messages/core'
import full from './messages/vi'
import { t } from './translate'
import { t as publicT } from './translate-public'
import { t as studentT } from './translate-student'

const original = createTranslator({ locale: 'vi', messages: full })

describe('scoped static translations', () => {
  it('preserves common messages and interpolation', () => {
    expect(t('common.requestError')).toBe(original('common.requestError'))
    const values = { min: '10.000', max: '100.000' }
    expect(t('product.invalidAmount', values)).toBe(original('product.invalidAmount', values))
  })

  it('keeps only the requested feature copy', () => {
    expect(publicT('publicCopy.m1')).toBe(original('publicCopy.m1'))
    expect(studentT('studentCopy.invalidDocument')).toBe(original('studentCopy.invalidDocument'))
    expect(Object.keys(core).some((key) => key.endsWith('Copy'))).toBe(false)
    expect(publicT.has('adminPagesCopy.m1' as Parameters<typeof publicT.has>[0])).toBe(false)
    expect(t.has('publicCopy.m1' as Parameters<typeof t.has>[0])).toBe(false)
  })
})
