import { describe, expect, it } from 'vitest'

import { bankSchema, creditSchema, quotaSchema, storageSchema } from './admin-schemas'
describe('admin form validation', () => {
  it('accepts normal questions and rejects empty or oversized prompts', () => {
    const value = { prompt: 'Câu hỏi', grades: ['Lớp 6'], points: 0.25 }
    expect(bankSchema.safeParse(value).success).toBe(true)
    for (const prompt of ['', '   ', 'x'.repeat(5001)])
      expect(bankSchema.safeParse({ ...value, prompt }).success).toBe(false)
  })
  it('requires a grade and positive finite points', () => {
    for (const points of [0, -1, NaN, Infinity])
      expect(bankSchema.safeParse({ prompt: 'Câu hỏi', grades: ['Lớp 6'], points }).success).toBe(
        false,
      )
    expect(bankSchema.safeParse({ prompt: 'Câu hỏi', grades: [], points: 1 }).success).toBe(false)
  })
  it('accepts positive credits and rejects invalid amounts', () => {
    expect(creditSchema.safeParse({ points: 120, note: '' }).success).toBe(true)
    for (const points of [0, -1, NaN, Infinity])
      expect(creditSchema.safeParse({ points, note: '' }).success).toBe(false)
  })
  it('supports unlimited quotas and validates storage bounds', () => {
    expect(quotaSchema.safeParse({ limit: null }).success).toBe(true)
    expect(quotaSchema.safeParse({ limit: 0 }).success).toBe(true)
    expect(quotaSchema.safeParse({ limit: -1 }).success).toBe(false)
    expect(storageSchema.safeParse({ mb: 1 }).success).toBe(true)
    for (const mb of [0, -1, 1025]) expect(storageSchema.safeParse({ mb }).success).toBe(false)
  })
})
