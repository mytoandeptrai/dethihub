import { describe, expect, it } from 'vitest'

import { isAiDocumentReplyComplete, parseAiDocumentReply, QuestionStreamParser, selectedExamPayload } from './ai-question-stream'

describe('question stream parser', () => {
  it.each([
    ['$' + String.raw`\times \neq \frac{1}{2} \beta \rho \nu \text{abc} \theta \cdot` + '$'],
    [String.raw`\(\times \neq \frac{1}{2} \beta \rho \nu \text{abc} \theta \cdot\)`],
    [String.raw`\[\times \neq \frac{1}{2} \beta \rho \nu \text{abc} \theta \cdot\]`],
  ])('retains single-backslash LaTeX in complete math spans: %s', (math) => {
    const source = `{"blocks":[{"type":"question","text":"${math}"}]}`
    expect(parseAiDocumentReply(source)?.blocks).toEqual([{ type: 'question', text: math }])
    const parser = new QuestionStreamParser()
    for (const char of source) parser.push(char)
    expect(parser.questions[0]?.prompt).toBe(math)
    parser.finish()
    expect(parser.questions[0]?.prompt).toBe(math)
    expect(parseAiDocumentReply(JSON.stringify({ blocks: [{ type: 'question', text: math }] }))?.blocks).toEqual([{ type: 'question', text: math }])
  })

  it('does not reinterpret valid escapes after an unpaired currency dollar', () => {
    const source = String.raw`{"say":"giá $5\nNam\tThanh\rmai\u0041","blocks":[]}`
    expect(parseAiDocumentReply(source)).toEqual(JSON.parse(source))
  })

  it.each([
    ['{"blocks":[]}', true],
    ['{"blocks":[{"text":"literal } [ \\\" bracket"}],}', true],
    ['{"action":"replace","blocks":[{"text":"partial"}', false],
    ['{"action":"append","blocks":[{"text":"partial', false],
    ['{"blocks":[]]', false],
    ['', false],
  ])('checks original JSON closure without accepting delimiter repair: %s', (source, expected) => {
    expect(isAiDocumentReplyComplete(String(source))).toBe(expected)
  })

  it.each([
    String.raw`{"action":"append","say":"giá $5\nNam\tThanh \"quote\" \\ \/ \u0041","blocks":[]}`,
    String.raw`{"action":"append","blocks":[{"type":"question","text":"$x\nNam\tText\u0041\/$"}]}`,
  ])('never rewrites valid JSON escapes after dollar signs: %s', (source) => {
    const expected = JSON.parse(source)
    expect(parseAiDocumentReply(source)).toEqual(expected)
    const parser = new QuestionStreamParser()
    for (const char of source) parser.push(char)
    parser.finish()
    expect(parser.blocks).toEqual(expected.blocks)
  })

  it('recovers bare LaTeX escapes split across chunks in a legacy replace reply', () => {
    const source = String.raw`{"action":"replace","say":"Đề đã sẵn sàng","blocks":[{"type":"heading","text":"ĐỀ TOÁN"},{"type":"question","no":1,"text":"Tính $BH \\cdot CH$ và $\\sqrt{2}$, $\\frac{1}{2}$","options":[]}]}`.replaceAll('\\\\', '\\')
    const parser = new QuestionStreamParser()
    for (const char of source) parser.push(char)
    expect(parser.questions).toHaveLength(1)
    expect(parser.questions[0]?.prompt).toBe(String.raw`Tính $BH \cdot CH$ và $\sqrt{2}$, $\frac{1}{2}$`)
    expect(parser.blocks).toHaveLength(2)
    expect(parseAiDocumentReply(source)?.action).toBe('replace')
  })

  it('recovers a fenced append reply with non-question blocks without damaging escaped text', () => {
    const source = '```json\n' + String.raw`{"action":"append","say":"Gửi thầy/cô **Lời giải chi tiết**","blocks":[{"type":"divider"},{"type":"heading","text":"LỜI GIẢI CHI TIẾT","level":1},{"type":"paragraph","text":"**Lời giải câu 1**\n$AH^2 = BH \cdot CH$, $\sqrt{2}$"}]}` + '\n```'
    expect(parseAiDocumentReply(source)).toMatchObject({ action: 'append', blocks: [{ type: 'divider' }, { type: 'heading' }, { type: 'paragraph', text: String.raw`**Lời giải câu 1**` + '\n' + String.raw`$AH^2 = BH \cdot CH$, $\sqrt{2}$` }] })
    expect(parseAiDocumentReply('Hello')).toBeNull()
    expect(parseAiDocumentReply('')).toBeNull()
    expect(parseAiDocumentReply('{broken}')).toBeNull()
  })

  it('retains math delimiters when converting rich-text questions for preview', () => {
    const parser = new QuestionStreamParser()
    parser.push(JSON.stringify({ blocks: [{ type: 'question', text: [{ text: 'Evaluate ' }, { math: 'x^2' }] }] }))
    expect(parser.questions[0]?.prompt).toBe('Evaluate $x^2$')
  })

  it('preserves correctly escaped backslashes, newlines, quotes and unicode', () => {
    const value = { action: 'append', say: 'Line 1\n"Line 2"', blocks: [{ type: 'question', text: String.raw`$\frac{1}{2} + \sqrt{2}$` + '\n∀' }] }
    const parser = new QuestionStreamParser()
    for (const char of JSON.stringify(value)) parser.push(char)
    parser.finish()
    expect(parseAiDocumentReply(JSON.stringify(value))).toEqual(value)
    expect(parser.questions[0]?.prompt).toBe(value.blocks[0]!.text)
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
