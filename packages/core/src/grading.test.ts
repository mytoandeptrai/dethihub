import { describe, expect, it } from 'vitest'

import {
  gradableMax,
  isAutoGraded,
  isFullyCorrect,
  missingKeyCount,
  normalizeShort,
  parseTrueFalse,
  readTrueFalseAnswer,
  sameShort,
  scoreQuestion,
} from './grading.js'

import type { Question } from './types.js'

const question = (overrides: Partial<Question>): Question => ({
  id: 'q1',
  number: 1,
  type: 'trac-nghiem',
  prompt: '',
  points: 1,
  ...overrides,
})

const trueFalse = (answer?: string) =>
  question({
    type: 'dung-sai',
    answer,
    options: ['a', 'b', 'c', 'd'].map((key) => ({ key, text: '' })),
  })

describe('parseTrueFalse', () => {
  it('reads Đ/S letters and Vietnamese words', () => {
    expect(parseTrueFalse('ĐSĐS', 4)).toEqual([true, false, true, false])
    expect(parseTrueFalse('đúng sai đúng sai', 4)).toEqual([true, false, true, false])
  })

  it('returns null when the count does not match or the input is empty', () => {
    expect(parseTrueFalse('ĐS', 4)).toBeNull()
    expect(parseTrueFalse(undefined, 4)).toBeNull()
  })
})

describe('readTrueFalseAnswer', () => {
  it('pads unanswered statements with null', () => {
    expect(readTrueFalseAnswer('Đ_S', 4)).toEqual([true, null, false, null])
  })
})

describe('sameShort', () => {
  it('compares numbers regardless of decimal separator', () => {
    expect(sameShort('-1,5', '-1.5')).toBe(true)
    expect(sameShort('+12', '12')).toBe(true)
    expect(sameShort('0,25', '0.250')).toBe(true)
  })

  it('rejects different numbers and non-numeric answers', () => {
    expect(sameShort('12', '13')).toBe(false)
    expect(sameShort('abc', 'abc')).toBe(false)
    expect(sameShort(undefined, '1')).toBe(false)
  })

  it('normalizes whitespace and separators', () => {
    expect(normalizeShort(' 1 2.5 ')).toBe('12,5')
  })
})

describe('scoreQuestion', () => {
  it('gives full points for the correct multiple-choice letter only', () => {
    const q = question({ answer: 'B', points: 0.25 })
    expect(scoreQuestion(q, 'B')).toBe(0.25)
    expect(scoreQuestion(q, 'C')).toBe(0)
    expect(scoreQuestion(q, undefined)).toBe(0)
  })

  it('scores true/false by the number of correct statements', () => {
    const q = trueFalse('ĐSĐS')
    expect(scoreQuestion(q, 'ĐSĐS')).toBe(1)
    expect(scoreQuestion(q, 'ĐSĐĐ')).toBe(0.5)
    expect(scoreQuestion(q, 'ĐSSĐ')).toBe(0.25)
    expect(scoreQuestion(q, 'ĐĐSĐ')).toBe(0.1)
    expect(scoreQuestion(q, 'SĐSĐ')).toBe(0)
  })

  it('scores a three-statement true/false proportionally', () => {
    const q = question({
      type: 'dung-sai',
      answer: 'ĐSĐ',
      options: ['a', 'b', 'c'].map((key) => ({ key, text: '' })),
      points: 1,
    })
    expect(scoreQuestion(q, 'ĐSS')).toBe(0.667)
  })

  it('scores a short answer numerically', () => {
    const q = question({ type: 'tra-loi-ngan', answer: '-1,5', points: 0.5 })
    expect(scoreQuestion(q, '-1.5')).toBe(0.5)
    expect(scoreQuestion(q, '1,5')).toBe(0)
  })

  it('never auto-scores essays', () => {
    expect(scoreQuestion(question({ type: 'tu-luan', points: 2 }), 'anything')).toBe(0)
  })
})

describe('isFullyCorrect', () => {
  it('requires a positive point value and a full score', () => {
    expect(isFullyCorrect(question({ answer: 'A' }), 'A')).toBe(true)
    expect(isFullyCorrect(question({ answer: 'A', points: 0 }), 'A')).toBe(false)
    expect(isFullyCorrect(trueFalse('ĐSĐS'), 'ĐSĐĐ')).toBe(false)
  })
})

describe('auto-grading coverage', () => {
  const questions = [
    question({ answer: 'A', points: 2 }),
    question({ answer: undefined, points: 3 }),
    trueFalse('ĐSĐS'),
    trueFalse(undefined),
    question({ type: 'tu-luan', points: 5 }),
  ]

  it('flags questions that can be graded automatically', () => {
    expect(questions.map((q) => isAutoGraded(q))).toEqual([true, false, true, false, false])
  })

  it('sums gradable points and counts missing keys', () => {
    expect(gradableMax(questions)).toBe(3)
    expect(missingKeyCount(questions)).toBe(2)
  })
})
