import { describe, expect, it } from 'vitest'
import { prepareAiApplication } from './aiApplication'
import { blocksToTipTap, plainText } from './convert'

describe('ai application preparation', () => {
  it.each(['insertBefore', 'insertAfter', 'append'])('warns when %s supplies an extra key but leaves the original key intact', (op) => {
    const question = { type: 'question' as const, no: 1, text: 'Cũ', options: [] }
    const key = { type: 'answerKey' as const, items: [{ no: 1, answer: 'A' }] }
    const current = blocksToTipTap([question, key])
    const blocks = [{ type: 'question', text: 'Mới', options: ['Sai', 'Đúng'] }, { type: 'answerKey', items: [{ no: 1, answer: 'B' }] }]
    const raw = op === 'append' ? { action: 'append', blocks } : { patch: [{ id: 'k0', op, blocks }] }
    const prepared = prepareAiApplication(raw, current)
    expect(prepared.answerKeyWarning).toBe(true)
    expect(prepared.answerKeyWarningReason).toBe('extra-key')
    expect(prepared.answers.find((item) => item.no === 1)?.answer).toBe('B')
    const withoutOldKey = prepareAiApplication(raw, blocksToTipTap([question]))
    expect(withoutOldKey.answerKeyWarning).toBe(false)
    expect(withoutOldKey.answerKeyWarningReason).toBeUndefined()
  })

  it('still warns when only one of multiple original answer keys is replaced', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Cũ', options: [] }, ...[1, 2].map((no) => ({ type: 'answerKey' as const, items: [{ no, answer: 'A' }] }))])
    const patch = [{ id: 'k0', block: { type: 'question', text: 'Mới' } }, { id: 'k1', block: { type: 'answerKey', items: [{ no: 1, answer: 'B' }] } }]
    expect(prepareAiApplication({ patch }, current).answerKeyWarning).toBe(true)
    expect(prepareAiApplication({ patch: [...patch, { id: 'k2', op: 'delete' }] }, current).answerKeyWarning).toBe(false)
    expect(prepareAiApplication({ patch: patch.slice(1) }, current).answerKeyWarning).toBe(false)
  })

  it.each(['replace', 'append', 'patch'])('uses only reply answer keys for touched questions in %s', (action) => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Cũ', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const question = { type: 'question', text: 'Mới', options: ['Sai', 'Đúng'] }
    const no = action === 'append' ? 2 : 1
    const key = { type: 'answerKey', items: [{ no, answer: 'B' }] }
    const prepared = prepareAiApplication({ action, blocks: [question, key], patch: [{ id: 'k0', block: question }, { id: 'k1', block: key }] }, current)
    expect(prepared.answers.find((item) => item.no === no)?.answer).toEqual('B')
    expect(prepared.answerKeyWarning).toBe(action === 'append')
  })

  it.each(['replace', 'append', 'patch'])('ignores unsupported per-question answer fields in %s', (action) => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Cũ', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const question = { type: 'question', text: 'Mới', answer: 'B', options: ['Sai', 'Đúng'] }
    const prepared = prepareAiApplication({ action, blocks: [question], patch: [{ id: 'k0', block: question }] }, current)
    expect(prepared.answers.find((item) => item.no === (action === 'append' ? 2 : 1))).toBeUndefined()
    expect(prepared.answerKeyWarning).toBe(true)
    expect(prepared.answerKeyWarningReason).toBe('missing-key')
    const applied = action === 'patch' ? prepared.patches[0].blocks : prepared.blocks
    expect(applied[0]).not.toHaveProperty('answer')
    expect(applied).toEqual(prepareAiApplication({ blocks: [{ ...question, answer: undefined }] }).blocks)
    expect(JSON.stringify(blocksToTipTap(applied))).not.toContain('examAnswerKey')
  })

  it.each([false, true])('never inherits answers when swapping one question per slot, updated reply key: %s', (explicit) => {
    const questions = [1, 2].map((no) => ({ type: 'question' as const, no, text: `Câu ${no}`, options: [] }))
    const current = blocksToTipTap([...questions, { type: 'answerKey', items: [{ no: 1, answer: 'A' }, { no: 2, answer: 'B' }] }])
    const patch = [{ id: 'k0', block: questions[1] }, { id: 'k1', block: questions[0] }]
    const keyPatch = { id: 'k2', block: { type: 'answerKey', items: [{ no: 1, answer: 'B' }, { no: 2, answer: 'A' }] } }
    const prepared = prepareAiApplication({ patch: [...patch, ...(explicit ? [keyPatch] : [])] }, current)
    expect(prepared.answers.map((item) => [item.no, plainText(item.answer)]).sort()).toEqual(explicit ? [[1, 'B'], [2, 'A']] : [])
    expect(prepared.answerKeyWarning).toBe(!explicit)
  })

  it.each([false, true])('handles the same plotted question as PNG then regenerated SVG without identity inference, updated reply key: %s', (explicit) => {
    const question = { type: 'question', text: 'Đồ thị nào?', options: ['Parabol'], figure: { kind: 'graph', curves: ['x^2'] } }
    const seed = prepareAiApplication({ blocks: [question] })
    const current = blocksToTipTap([...seed.blocks, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const image = current.content?.[0].content?.[0].content?.find((node) => node.type === 'image')
    expect(image?.attrs?.src).toContain('data:image/svg+xml')
    if (image?.attrs) image.attrs.src = 'data:image/png;base64,AAAA'
    const keyPatch = { id: 'k1', block: { type: 'answerKey', items: [{ no: 1, answer: 'A' }] } }
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [question, { type: 'question', text: 'Câu bổ sung', options: [] }] }, ...(explicit ? [keyPatch] : [])] }, current)
    expect(() => blocksToTipTap(prepared.patches.flatMap((patch) => patch.blocks))).not.toThrow()
    expect(JSON.stringify(prepared.patches)).toContain('data:image/svg+xml')
    expect(prepared.answers.map((item) => [item.no, plainText(item.answer)])).toEqual(explicit ? [[1, 'A']] : [])
    expect(prepared.answerKeyWarning).toBe(!explicit)
  })

  it('keeps untouched answers only before all question operations and prefers an explicit updated key', () => {
    const questions = [1, 2, 3].map((no) => ({ type: 'question' as const, no, text: `Câu ${no}`, options: [] }))
    const current = blocksToTipTap([...questions, { type: 'answerKey', items: [1, 2, 3].map((no) => ({ no, answer: 'A' })) }])
    const patch = [{ id: 'k1', block: questions[1] }]
    const prepared = prepareAiApplication({ patch }, current)
    expect(prepared.answers.map((item) => [item.no, plainText(item.answer)])).toEqual([[1, 'A']])
    expect(prepared.answerKeyWarning).toBe(true)
    const updated = prepareAiApplication({ patch: [...patch, { id: 'k3', block: { type: 'answerKey', items: [{ no: 2, answer: 'C' }] } }] }, current)
    expect(updated.answers.find((item) => item.no === 2)?.answer).toEqual('C')
    expect(updated.answerKeyWarning).toBe(false)
  })

  it('does not use ignored answer keys or no-op question proposals', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Cũ', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', block: { type: 'question', text: 'Mới' } }, { id: 'k99', block: { type: 'answerKey', items: [{ no: 1, answer: 'B' }] } }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
    expect(prepareAiApplication({ patch: [{ id: 'k99', block: { type: 'question', text: 'Không áp dụng' } }] }, current).answerKeyWarning).toBe(false)
    expect(prepareAiApplication({ action: 'replace', blocks: [] }, current).answerKeyWarning).toBe(false)
    const deleted = prepareAiApplication({ patch: [{ id: 'k0', op: 'delete' }] }, current)
    expect(deleted.answers).toEqual([])
    expect(deleted.answerKeyWarning).toBe(true)
  })

  it('supports short answers from reply keys and an explicitly empty updated answer key', () => {
    const question = { type: 'question', kind: 'short', text: 'Đáp số?' }
    const prepared = prepareAiApplication({ blocks: [question, { type: 'answerKey', items: [{ no: 1, answer: '12' }] }] })
    expect(prepared.answers).toEqual([{ no: 1, answer: '12' }])
    expect(prepared.answerKeyWarning).toBe(false)
    const cleared = prepareAiApplication({ blocks: [question, { type: 'answerKey', items: [] }] })
    expect(cleared.answers).toEqual([])
    expect(cleared.answerKeyWarning).toBe(false)
    const empty = prepareAiApplication({ blocks: [] })
    expect(empty.answers).toEqual([])
    expect(empty.answerKeyWarning).toBe(false)
  })
  it('infers replacement for non-empty blocks with an empty patch while keeping truly empty patches as no-ops', () => {
    const blocks = [{ type: 'paragraph', text: 'Nội dung thay thế' }]
    const prepared = prepareAiApplication({ patch: [], blocks })
    expect(prepared.action).toBe('replace')
    expect(prepared.noChanges).toBe(false)
    expect(prepared.blocks).toEqual(blocks)
    expect(prepareAiApplication({ action: 'append', patch: [], blocks }).action).toBe('append')
    expect(prepareAiApplication({ patch: [], blocks: [] })).toMatchObject({ action: 'patch', noChanges: true })
  })
  it('does not give an inserted question the answer of a rewritten original in the same replacement', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Câu gốc', options: [{ label: 'A', text: 'Đúng' }, { label: 'B', text: 'Sai' }] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [{ type: 'question', text: 'Câu mới', options: ['Sai', 'Đúng'] }, { type: 'question', text: 'Câu gốc được viết lại', options: ['Đúng', 'Sai'] }] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })

  it.each([false, true])('never inherits a replaced question answer even when its content is unchanged: %s', (unchanged) => {
    const current = blocksToTipTap([1, 2, 3].map((no) => ({ type: 'question' as const, no, text: `Câu ${no}`, options: [] })))
    current.content?.push(...(blocksToTipTap([{ type: 'answerKey', items: [{ no: 3, answer: 'C' }] }]).content ?? []))
    const prepared = prepareAiApplication({ patch: [
      { id: 'k2', block: { type: 'question', text: unchanged ? 'Câu 3' : 'Câu 3 viết lại', options: [] } },
      { id: 'k0', op: 'delete' },
      { id: 'k1', op: 'insertBefore', block: { type: 'question', text: 'Câu mới ở trước', options: [] } },
    ] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })

  it('does not inherit a revised question answer even when other insertions are strictly after it', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Câu gốc', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', block: { type: 'question', text: 'Câu viết lại', options: [] } }, { id: 'k0', op: 'insertAfter', block: { type: 'question', text: 'Câu mới phía sau', options: [] } }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
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
  it.each(['before', 'after'])('does not inherit answers for a copied question with an explanation %s it', (position) => {
    const question = { type: 'question' as const, no: 1, text: '1 + 1 = ?', options: [{ label: 'A', text: '2' }] }
    const explanation = { type: 'paragraph', text: 'Giải thích: cộng hai số một.' }
    const current = blocksToTipTap([question, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: position === 'before' ? [explanation, question] : [question, explanation] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })

  it('does not inherit answers for a copied question before additional questions', () => {
    const question = { type: 'question' as const, no: 1, text: 'Câu gốc', options: [{ label: 'A', text: 'Đúng' }] }
    const current = blocksToTipTap([{ type: 'paragraph', text: 'Tiêu đề' }, question, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k1', blocks: [question, { type: 'question', text: 'Câu mới', options: [] }, { type: 'paragraph', text: 'Giải thích' }] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
  })

  it('does not inherit answers for a same-index revision with explanation siblings', () => {
    const current = blocksToTipTap([{ type: 'question', no: 1, text: 'Đề bài cũ', options: [] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }])
    const prepared = prepareAiApplication({ patch: [{ id: 'k0', blocks: [{ type: 'question', text: 'Đề bài được sửa', options: [] }, { type: 'paragraph', text: 'Giải thích' }] }] }, current)
    expect(prepared.answers).toEqual([])
    expect(prepared.answerKeyWarning).toBe(true)
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
    expect(prepareAiApplication({ blocks: [{ type: 'question', text: 'Chưa có đáp án' }] }).answerKeyWarning).toBe(true)
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
