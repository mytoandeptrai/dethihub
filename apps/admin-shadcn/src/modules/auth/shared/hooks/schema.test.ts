import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import messages from '@/i18n/messages/vi'

import { authSchema, initialAuthFormData } from './schema'

const t = createTranslator({ locale: 'vi', messages, namespace: 'auth' })

describe('auth form schema', () => {
  it('trims email and display name without altering a password', () => {
    const parsed = authSchema('register', t).parse({
      name: '  Giáo viên  ',
      email: '  teacher@example.com  ',
      password: ' secret 123 ',
      confirm: ' secret 123 ',
      accepted: true,
    })
    expect(parsed.name).toBe('Giáo viên')
    expect(parsed.email).toBe('teacher@example.com')
    expect(parsed.password).toBe(' secret 123 ')
  })
  it.each(['login', 'register', 'forgot', 'reset'] as const)('rejects an empty %s form', (mode) => {
    expect(authSchema(mode, t).safeParse(initialAuthFormData).success).toBe(false)
  })
  it('requires password confirmation and at least eight characters for reset', () => {
    const schema = authSchema('reset', t)
    expect(
      schema.safeParse({ ...initialAuthFormData, password: '1234567', confirm: '1234567' }).success,
    ).toBe(false)
    expect(
      schema.safeParse({ ...initialAuthFormData, password: '12345678', confirm: '12345679' })
        .success,
    ).toBe(false)
    expect(
      schema.safeParse({ ...initialAuthFormData, password: '12345678', confirm: '12345678' })
        .success,
    ).toBe(true)
  })
})
