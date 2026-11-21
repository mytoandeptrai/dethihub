import { describe, expect, it } from 'vitest'

import { docToExam } from './doc-to-exam.js'

import type { ExamBlock, ExamDoc } from './doc-types.js'

const doc = (blocks: ExamBlock[], overrides: Partial<ExamDoc> = {}): ExamDoc => ({
  id: 'd1',
  title: 'Đề kiểm tra',
  subject: 'Toán',
  grade: 'Lớp 12',
  term: '',
  schoolYear: '2025-2026',
  duration: '90',
  unit: 'THPT A',
  authority: '',
  blocks,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const mcq = (no: number): ExamBlock => ({
  type: 'question',
  no,
  text: `Câu ${no}`,
  options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: `Đáp án ${label}` })),
})

describe('docToExam', () => {
  it('returns the stored online exam untouched apart from the id', () => {
    const online = docToExam(doc([]), 'x')
    const wrapped = docToExam(doc([], { online }), 'new-id')
    expect(wrapped).toEqual({ ...online, id: 'new-id' })
  })

  it('splits points evenly across multiple-choice questions out of 10', () => {
    const exam = docToExam(doc([mcq(1), mcq(2), mcq(3), mcq(4)]), 'e')
    const [section] = exam.sections
    expect(section?.title).toBe('PHẦN I. TRẮC NGHIỆM')
    expect(section?.questions.map((q) => q.points)).toEqual([2.5, 2.5, 2.5, 2.5])
  })

  it('reads multiple-choice answers from the answer key by letter', () => {
    const exam = docToExam(
      doc([
        mcq(1),
        mcq(2),
        {
          type: 'answerKey',
          items: [
            { no: 1, answer: 'B' },
            { no: 2, answer: 'C. 12 cm' },
          ],
        },
      ]),
      'e',
    )
    expect(exam.sections[0]?.questions.map((q) => q.answer)).toEqual(['B', 'C'])
  })

  it('numbers questions continuously and orders sections by type', () => {
    const exam = docToExam(
      doc([
        mcq(1),
        {
          type: 'question',
          no: 2,
          kind: 'tf',
          text: 'Cho hàm số',
          options: ['a', 'b', 'c', 'd'].map((label) => ({ label, text: label })),
        },
        { type: 'question', no: 3, kind: 'short', text: 'Tính', options: [] },
        { type: 'essay', no: 1, text: 'Chứng minh', score: 2 },
        {
          type: 'answerKey',
          items: [
            { no: 2, answer: 'ĐSĐS' },
            { no: 3, answer: '-1,5' },
          ],
        },
      ]),
      'e',
    )
    expect(exam.sections.map((s) => s.title)).toEqual([
      'PHẦN I. TRẮC NGHIỆM',
      'PHẦN II. ĐÚNG/SAI',
      'PHẦN III. TRẢ LỜI NGẮN',
      'PHẦN IV. TỰ LUẬN',
    ])
    const [mcqQ] = exam.sections[0]?.questions ?? []
    const [tfQ] = exam.sections[1]?.questions ?? []
    const [shortQ] = exam.sections[2]?.questions ?? []
    expect([mcqQ?.number, tfQ?.number, shortQ?.number]).toEqual([1, 2, 3])
    expect(tfQ?.answer).toBe('ĐSĐS')
    expect(shortQ?.answer).toBe('-1,5')
    expect(shortQ?.points).toBe(0.5)
  })

  it('takes the duration from the "Thời gian" line on the page', () => {
    const exam = docToExam(
      doc([{ type: 'paragraph', text: 'Thời gian làm bài: 60 phút' }, mcq(1)], { duration: '90' }),
      'e',
    )
    expect(exam.durationMinutes).toBe(60)
  })

  it('attaches the written solution to the matching question', () => {
    const exam = docToExam(
      doc([
        mcq(1),
        { type: 'heading', text: 'Lời giải' },
        { type: 'paragraph', text: 'Câu 1. Vì 1 + 1 = 2' },
      ]),
      'e',
    )
    expect(exam.sections[0]?.questions[0]?.explanation).toBe('Vì 1 + 1 = 2')
  })
})
