import { describe, expect, it } from 'vitest'
import { prepareAiApplication } from './aiApplication'
import { blocksToTipTap, plainText } from './convert'

describe('AI application rich values', () => {
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
