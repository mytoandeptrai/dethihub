import { describe, expect, it } from 'vitest'
import { prepareAiApplication } from './aiApplication'
import { blocksToTipTap, plainText } from './convert'

describe('ai application preparation', () => {
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
