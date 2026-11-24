import { describe, expect, it } from 'vitest'

import { QuestionStreamParser, selectedExamPayload } from './ai-question-stream'

describe('question stream parser', () => {
  it('retains math delimiters when converting rich-text questions for preview', () => {
    const parser = new QuestionStreamParser()
    parser.push(JSON.stringify({ blocks: [{ type: 'question', text: [{ text: 'Evaluate ' }, { math: 'x^2' }] }] }))
    expect(parser.questions[0]?.prompt).toBe('Evaluate $x^2$')
  })

  it('emits only complete questions and ignores nested objects and quoted braces', () => {
    const parser = new QuestionStreamParser()
    parser.push('```json\n{"blocks":[{"type":"question","no":1,"text":"A } \\\" B","options":[]},')
    expect(parser.questions).toHaveLength(1)
    parser.push('{"type":"question","no":2,"text":"incomplete","options":[{"label":"A","text":"yes"}')
    expect(parser.questions).toHaveLength(1)
    parser.push(']}]}\n```')
    expect(parser.questions.map((question) => question.number)).toEqual([1, 2])
  })

  it('supports the online questions envelope without engine-specific types', () => {
    const parser = new QuestionStreamParser()
    parser.push('{"questions":[{"type":"tu-luan","prompt":"Explain","answer":"A"}]}')
    expect(parser.questions[0]).toMatchObject({ id: 'questions:0', prompt: 'Explain' })
  })

  it('keeps completed questions after malformed or truncated output', () => {
    const parser = new QuestionStreamParser()
    parser.push('{"blocks":[{"type":"question","no":1,"text":"First","options":[]},bad')
    expect(parser.questions).toHaveLength(1)
    expect(new QuestionStreamParser().questions).toEqual([])
  })

  it('inserts only selected complete questions and their answer-key entries', () => {
    const parser = new QuestionStreamParser()
    parser.push(JSON.stringify({ blocks: [
      { type: 'question', no: 1, text: 'First', options: [] },
      { type: 'question', no: 2, text: 'Second', options: [] },
      { type: 'answerKey', items: [{ no: 1, answer: 'A' }, { no: 2, answer: 'B' }] },
    ] }))
    const payload = JSON.parse(selectedExamPayload(parser.questions.slice(1), parser.blocks))
    expect(payload.action).toBe('append')
    expect(payload.blocks).toEqual([
      { type: 'question', no: 2, text: 'Second', options: [] },
      { type: 'answerKey', items: [{ no: 2, answer: 'B' }] },
    ])
  })
})
