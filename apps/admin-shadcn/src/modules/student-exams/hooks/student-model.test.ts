import { describe, expect, it } from 'vitest'

import { studentSchema } from './student-model'

describe('student identity', () => {
  it('trims student fields and accepts an optional seat', () => {
    expect(studentSchema([]).parse({ name: ' An ', className: ' 10A1 ', seat: '' })).toEqual({
      name: 'An',
      className: '10A1',
      seat: '',
    })
  })
  it('rejects empty identity and out-of-range seats', () => {
    expect(studentSchema([]).safeParse({ name: '', className: '', seat: '1000' }).success).toBe(
      false,
    )
    expect(studentSchema([]).safeParse({ name: 'An', className: '10A1', seat: '0' }).success).toBe(
      false,
    )
  })
  it('requires a listed roster name when a roster is configured', () => {
    expect(
      studentSchema(['An']).safeParse({ name: 'Bình', className: '10A1', seat: '' }).success,
    ).toBe(false)
  })
})
