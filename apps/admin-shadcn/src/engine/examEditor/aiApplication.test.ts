import { describe, expect, it } from 'vitest'
import { prepareAiApplication } from './aiApplication'
import { blocksToTipTap, plainText } from './convert'

describe('ai application preparation', () => {
  it('does not give an inserted question the answer of a rewritten original in the same replacement', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Câu gốc', options: [{ label: 'A', text: 'Đúng' }, { label: 'B', text: 'Sai' }] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [{ type: 'question', text: 'Câu mới', options: ['Sai', 'Đúng'] }, { type: 'question', text: 'Câu gốc được viết lại', options: ['Đúng', 'Sai'] }] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })

  it.each([false, true])('allows a structurally affected same-index question only with exact content: %s', (unchanged) => {
    const current = blocksToTipTap([1, 2, 3].map((no) => ({ type: 'question' as const, no, text: `Câu ${no}`, options: [] })))
    current.content?.push(...(blocksToTipTap([{ type: 'answerKey', items: [{ no: 3, answer: 'C' }] }]).content ?? []))
    const prepared = prepareAiApplication({ patch: [
      { id: 'k2', block: { type: 'question', text: unchanged ? 'Câu 3' : 'Câu 3 viết lại', options: [] } },
      { id: 'k0', op: 'delete' },
      { id: 'k1', op: 'insertBefore', block: { type: 'question', text: 'Câu mới ở trước', options: [] } },
    ] }, current)
    expect(prepared.answers.map((item) => plainText(item.answer))).toEqual(unchanged ? ['C'] : [])
    expect(prepared.answerKeyWarning).toBe(!unchanged)
  })

  it('allows a same-index revision when question insertions are strictly after it', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Câu gốc', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', block: { type: 'question', text: 'Câu viết lại', options: [] } }, { id: 'k0', op: 'insertAfter', block: { type: 'question', text: 'Câu mới phía sau', options: [] } }] }, current)
    expect(prepared.answers.map((item) => plainText(item.answer))).toEqual(['A'])
    expect(prepared.answerKeyWarning).toBe(false)
  })

  it('does not treat changed rich-text marks as an exact content match after preceding structural changes', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Trước', options: [] }, { type: 'question', no: 2, text: 'Sau', options: [] }, { type: 'answerKey', items: [{ no: 2, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', op: 'delete' }, { id: 'k1', op: 'insertBefore', block: { type: 'question', text: 'Mới', options: [] } }, { id: 'k1', block: { type: 'question', text: [{ text: 'Sau', marks: [{ type: 'bold' }] }], options: [] } }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })
  it.each([
    { patch: [] },
    { patch: [{ id: 'not-an-id', block: { type: 'paragraph', text: 'Không áp dụng' } }] },
    { patch: [{ id: null, block: { type: 'paragraph', text: 'Không áp dụng' } }, { op: 'delete' }] },
  ])('classifies an unusable patch array as a patch no-op: $patch', ({ patch }) => {
    const prepared = prepareAiApplication({ say: 'Đã sửa xong.', patch })
    expect(prepared.action).toBe('patch')
    expect(prepared.noChanges).toBe(true)
    expect(prepared.patches).toEqual([])
  })

  it('does not infer replacement blocks when an unusable patch array was supplied', () => {
    const prepared = prepareAiApplication({ patch: [{ id: 'bad' }], blocks: [{ type: 'paragraph', text: 'Không được thay đề' }] })
    expect(prepared.action).toBe('patch')
    expect(prepared.noChanges).toBe(true)
    expect(prepareAiApplication({ blocks: [{ type: 'paragraph', text: 'Đề mới' }] }).action).toBe('replace')
    expect(prepareAiApplication({ say: 'Lời giải' }).action).toBe('none')
    expect(prepareAiApplication({ action: 'replace', patch: [], blocks: [{ type: 'paragraph', text: 'Đề mới' }] }).action).toBe('replace')
  })
  it.each(['before', 'after'])('keeps a replaced question identity with an explanation %s it', (position) => {
    const question = { type: 'question' as const, no: 1, text: '1 + 1 = ?', options: [{ label: 'A', text: '2' }] }
    const explanation = { type: 'paragraph', text: 'Giải thích: cộng hai số một.' }
    const current = blocksToTipTap([question, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: position === 'before' ? [explanation, question] : [question, explanation] }] }, current)
    expect(prepared.answers.map((item) => [item.no, plainText(item.answer)])).toEqual([[1, 'A']])
    expect(prepared.answerKeyWarning).toBe(false)
  })

  it('preserves a copied question before additional questions without relying on generated IDs', () => {
    const question = { type: 'question' as const, no: 1, text: 'Câu gốc', options: [{ label: 'A', text: 'Đúng' }] }
    const current = blocksToTipTap([{ type: 'paragraph', text: 'Tiêu đề' }, question, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k1', blocks: [question, { type: 'question', text: 'Câu mới', options: [] }, { type: 'paragraph', text: 'Giải thích' }] }] }, current)
    expect(prepared.answers.map((item) => plainText(item.answer))).toEqual(['A'])
    expect(prepared.answerKeyWarning).toBe(false)
  })

  it('keeps identity for a revised question at the same question position with explanation siblings', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Đề bài cũ', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [{ type: 'question', text: 'Đề bài được sửa', options: [] }, { type: 'paragraph', text: 'Giải thích' }] }] }, current)
    expect(prepared.answers.map((item) => plainText(item.answer))).toEqual(['A'])
    expect(prepared.answerKeyWarning).toBe(false)
  })

  it('still warns when the copied question actually shifts behind another replacement question', () => {
    const question = { type: 'question' as const, no: 1, text: 'Câu gốc', options: [] }
    const current = blocksToTipTap([question, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [{ type: 'question', text: 'Câu mới ở trước', options: [] }, question] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })
  it('uses an explicitly updated answer key for inserted questions', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: '1 + 1 = ?', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', op: 'insertBefore', block: { type: 'question', text: '1 + 2 = ?', options: ['2', '3'] } }, { id: 'k1', block: { type: 'answerKey', items: [{ no: 1, answer: 'B' }, { no: 2, answer: 'A' }] } }] }, current)
    expect(prepared.answers.map((item) => [item.no, plainText(item.answer)])).toEqual([[1, 'B'], [2, 'A']])
    expect(prepared.answerKeyWarning).toBe(false)
  })

  it('keeps unchanged answers when non-question blocks are inserted', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Đề bài', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', op: 'insertBefore', block: { type: 'paragraph', text: 'Ghi chú' } }] }, current)
    expect(prepared.answers.map((item) => plainText(item.answer))).toEqual(['A'])
    expect(prepared.answerKeyWarning).toBe(false)
    expect(prepareAiApplication({ blocks: [{ type: 'question', text: 'Chưa có đáp án' }] }).answerKeyWarning).toBe(false)
  })
  it('does not infer correctness from an old answer key after inserting a question before its owner', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: '1 + 1 = ?', options: [{ label: 'A', text: '2' }] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', op: 'insertBefore', block: { type: 'question', text: '1 + 2 = ?', options: ['2', '3'] } }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })
  it.each(['replace', 'append', 'patch'])('normalizes object bullet items without crashing %s preparation', (action) => {
    const block = { type: 'bullets', items: [{ text: 'Giữ nội dung' }, 42, null, [null, { text: 7 }, 'Chuỗi hợp lệ', { text: 'Nội dung rich', marks: [null, { type: 'bold' }] }]] }
    const prepared = prepareAiApplication({ action, blocks: [block], patch: [{ id: 'k0', block }] }, { type: 'doc', content: [{ type: 'paragraph' }] })
    const blocks = action === 'patch' ? prepared.patches.flatMap((patch) => patch.blocks) : prepared.blocks
    const json = blocksToTipTap(blocks)
    expect(JSON.stringify(json)).toContain('Giữ nội dung')
    expect(JSON.stringify(json)).toContain('Chuỗi hợp lệ')
    expect(JSON.stringify(json)).not.toContain('"text":7')
  })

  it('normalizes malformed values across all rich fields and keeps valid figure spans', () => {
    const bad = [null, 7, false, { text: {} }, { text: 'Đúng', marks: { length: 1 } }, { image: { src: '/image.png', width: 'bad' } }]
    const prepared = prepareAiApplication({ blocks: [{ type: 'paragraph', text: bad }, { type: 'grid', cells: [{ text: 'Ô lưới' }, bad] }, { type: 'essay', text: bad, sub: [{ text: 'Ý a' }, bad] }, { type: 'header', text: 'Tiêu đề cũ' }] })
    expect(() => blocksToTipTap(prepared.blocks)).not.toThrow()
    expect(JSON.stringify(blocksToTipTap(prepared.blocks))).toContain('/image.png')
    const header = prepared.blocks.find((block) => block.type === 'header')
    expect(header?.type === 'header' && plainText(header.left)).toBe('Tiêu đề cũ')
    expect(prepareAiApplication({ blocks: null }).blocks).toEqual([])
  })
})
