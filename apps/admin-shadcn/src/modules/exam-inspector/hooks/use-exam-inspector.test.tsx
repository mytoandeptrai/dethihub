import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { activateInsertedBlock } from '@/modules/exam-inspector/lib/inspector-selection'
import { useExamInspector } from './use-exam-inspector'

import type { Mark, Node } from '@tiptap/core'

const { BaseParagraphNode, EXAM_NODES, EXAM_MARKS } = await vi.importActual<{
  BaseParagraphNode: Node; EXAM_NODES: Node[]; EXAM_MARKS: Mark[]
}>('@/engine/examEditor/schema')
const editors: Editor[] = []
function fixture() {
  const editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit.configure({ paragraph: false, underline: false }), BaseParagraphNode, ...EXAM_NODES.filter(node => node.name !== 'examAnswerKey'), ...EXAM_MARKS], content: { type: 'doc', content: [{ type: 'examTitle', content: [{ type: 'text', text: 'Original' }] }, { type: 'examParagraph', content: [{ type: 'text', text: 'Other' }] }] } })
  editors.push(editor)
  return editor
}
afterEach(() => { for (const editor of editors.splice(0)) editor.destroy() })

describe('inspector synchronization', () => {
  it('reads canvas transactions; writes immediately without echoes; groups typing and undoes', () => {
    const editor = fixture(), reveal = vi.fn()
    const { result } = renderHook(() => useExamInspector(editor, reveal))
    act(() => editor.commands.setTextSelection(2))
    const id = result.current.activeInspectorBlock!.id
    act(() => editor.commands.insertContent('Canvas'))
    expect(result.current.blocks[0]!.node.textContent).toContain('Canvas')
    let count = 0
    editor.on('transaction', () => count++)
    act(() => result.current.writeValues(id, { text: 'First' }, 'text'))
    act(() => result.current.writeValues(id, { text: 'First second' }, 'text'))
    expect(count).toBe(2)
    expect(editor.state.doc.firstChild!.textContent).toBe('First second')
    expect(result.current.origin).toBe('form')
    expect(reveal).not.toHaveBeenCalled()
    act(() => result.current.undo())
    expect(editor.state.doc.firstChild!.textContent).toContain('Canvas')
    expect(result.current.origin).toBe('history')
  })

  it('reveals only for an explicit canvas click or insertion; maps positions and clears on deletion', () => {
    const editor = fixture(), reveal = vi.fn()
    const { result } = renderHook(() => useExamInspector(editor, reveal))
    act(() => editor.commands.setTextSelection(2))
    expect(reveal).not.toHaveBeenCalled()
    act(() => fireEvent.click(editor.view.dom))
    expect(reveal).toHaveBeenCalledOnce()
    const oldId = result.current.activeInspectorBlock!.id
    act(() => { editor.commands.insertContentAt(0, { type: 'examTitle', content: [{ type: 'text', text: 'Inserted' }] }); activateInsertedBlock(editor, 0, 'title') })
    expect(reveal).toHaveBeenCalledTimes(2)
    expect(result.current.activeInspectorBlock!.id).not.toBe(oldId)
    expect(result.current.activeInspectorBlock!.pos).toBe(0)
    act(() => result.current.deleteActive())
    expect(editor.state.doc.firstChild!.textContent).not.toBe('Inserted')
    expect(result.current.activeInspectorBlock).toBeNull()
    act(() => result.current.undo())
    expect(editor.state.doc.firstChild!.textContent).toBe('Inserted')
  })

  it('rejects invalid writes and resets state when switching editors', () => {
    const first = fixture(), second = fixture()
    const { result, rerender } = renderHook(({ editor }) => useExamInspector(editor, vi.fn()), { initialProps: { editor: first } })
    act(() => first.commands.setTextSelection(2))
    const id = result.current.activeInspectorBlock!.id
    act(() => result.current.writeValues(id, { unknown: 'invalid' }, 'unknown'))
    expect(first.state.doc.firstChild!.textContent).toBe('Original')
    rerender({ editor: second })
    expect(result.current.editor).toBe(second)
    expect(result.current.blocks[0]!.node).toBe(second.state.doc.firstChild)
  })
})
