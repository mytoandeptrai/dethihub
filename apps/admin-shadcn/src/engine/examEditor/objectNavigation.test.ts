import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextSelection } from '@tiptap/pm/state'
import { GapCursor } from '@tiptap/pm/gapcursor'
import { afterEach, describe, expect, it } from 'vitest'
import { BaseParagraphNode, EXAM_MARKS, EXAM_NODES } from './schema'
import { ObjectNavigation, isTypingHelper } from './objectNavigation'
import { tipTapToBlocks } from './convert'
import { computePagePlan } from './pagination'
import type { JSONContent } from '@tiptap/core'

const editors: Editor[] = []
const picture: JSONContent = { type: 'examParagraph', content: [{ type: 'image', attrs: { src: '/brand/ai-static.svg', width: 100 } }] }
const table: JSONContent = { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph' }] }] }] }
function setup(content: JSONContent[] = [picture], editable = true) {
  const editor = new Editor({
    element: document.createElement('div'), editable,
    extensions: [StarterKit.configure({ paragraph: false, underline: false, trailingNode: false }), BaseParagraphNode, ...EXAM_NODES, ...EXAM_MARKS, Table, TableRow, TableCell, TableHeader, ObjectNavigation],
    content: { type: 'doc', content }, editorProps: { handleScrollToSelection: () => true },
  })
  editors.push(editor)
  editor.view.dispatch(editor.state.tr)
  return editor
}
function key(editor: Editor, value: string) {
  editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
}
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('object navigation', () => {
  it.each(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'])('does not change document or page count when navigating between objects with %s', (arrow) => {
    const editor = setup([{ type: 'examDivider' }, { type: 'examDivider' }])
    const before = editor.getJSON()
    const pages = () => {
      const blocks = Array.from(editor.view.dom.children).filter((node) => !isTypingHelper(node))
      return computePagePlan(blocks.map((node) => node.tagName === 'P' ? 24 : 400), blocks.map(() => 0), 800, 1000, 100).pages
    }
    expect(pages()).toBe(1)
    editor.commands.setNodeSelection(arrow === 'ArrowRight' || arrow === 'ArrowDown' ? 0 : 1)
    key(editor, arrow)
    expect(editor.getJSON()).toEqual(before)
    expect(pages()).toBe(1)
    expect(editor.state.selection).toBeInstanceOf(GapCursor)
    key(editor, 'Enter')
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    editor.commands.insertContent('Giữa hai khối')
    expect(editor.state.doc.child(1).textContent).toBe('Giữa hai khối')
  })
  it.each([picture, table, { type: 'examDivider' }, { type: 'examToc' }])('keeps a single empty typing tail after a final object: $type', (block) => {
    const editor = setup([block])
    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph')
    expect(editor.state.doc.childCount).toBe(2)
    expect(editor.view.dom.lastElementChild).toHaveAttribute('data-typing-tail', 'true')
    editor.view.dispatch(editor.state.tr)
    expect(editor.state.doc.childCount).toBe(2)
  })

  it.each([picture, table, { type: 'examDivider' }])('enter leaves $type intact and focuses an empty paragraph after it', (block) => {
    const editor = setup([block])
    const original = editor.state.doc.firstChild!.toJSON()
    editor.commands.setNodeSelection(block.type === 'examParagraph' ? 1 : 0)
    key(editor, 'Enter')
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph')
    expect(editor.state.selection.$from.index(0)).toBe(1)
    expect(editor.state.doc.firstChild!.toJSON()).toEqual(original)
    editor.commands.insertContent('Nội dung sau ảnh')
    expect(editor.state.doc.child(1).textContent).toBe('Nội dung sau ảnh')
  })

  it.each(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'])('moves a selected table to a cursor without inserting content with %s', (arrow) => {
    const editor = setup([table])
    const before = editor.getJSON()
    editor.commands.setNodeSelection(0)
    key(editor, arrow)
    expect(editor.getJSON()).toEqual(before)
    expect(editor.state.selection.empty).toBe(true)
    expect(tipTapToBlocks(editor.getJSON()).filter((block) => block.type === 'table')).toHaveLength(1)
  })

  it.each(['ArrowRight', 'ArrowLeft'])('preserves surrounding text when moving past inline math with %s', (arrow) => {
    const editor = setup([{ type: 'examParagraph', content: [{ type: 'text', text: 'A' }, { type: 'inlineMath', attrs: { latex: 'x^2' } }, { type: 'text', text: 'B' }] }])
    const original = editor.getJSON()
    editor.commands.setNodeSelection(2)
    key(editor, arrow)
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    expect(editor.state.selection.from).toBe(arrow === 'ArrowRight' ? 3 : 2)
    expect(editor.getJSON()).toEqual(original)
  })

  it('starts printable input after a selected image instead of replacing it', () => {
    const editor = setup()
    editor.commands.setNodeSelection(1)
    key(editor, 'A')
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    editor.commands.insertContent('A')
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('image')
    expect(editor.state.doc.child(1).textContent).toBe('A')
    expect(editor.view.dom.lastElementChild).not.toHaveAttribute('data-typing-tail')
  })

  it('protects composition and direct text input when an object remains selected', () => {
    const editor = setup()
    editor.commands.setNodeSelection(1)
    const handled = editor.view.someProp('handleTextInput', (handler) => handler(editor.view, 1, 2, 'Đề', () => editor.state.tr))
    expect(handled).toBe(true)
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('image')
    expect(editor.state.doc.child(1).textContent).toBe('Đề')
  })

  it('starts IME composition outside the selected image', () => {
    const editor = setup()
    editor.commands.setNodeSelection(1)
    editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    expect(editor.state.selection.$from.index(0)).toBe(1)
    editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('image')
  })

  it('leaves an answer-key table outside its wrapper so new text is saved', () => {
    const editor = setup([{ type: 'examAnswerKey', content: [table] }])
    editor.commands.setNodeSelection(1)
    key(editor, 'Enter')
    expect(editor.state.selection.$from.depth).toBe(1)
    editor.commands.insertContent('Lời giải bên dưới')
    expect(tipTapToBlocks(editor.getJSON()).at(-1)).toEqual({ type: 'paragraph', text: 'Lời giải bên dưới' })
  })

  it('does not serialize the empty typing tail into ExamDoc blocks', () => {
    const editor = setup()
    expect(tipTapToBlocks(editor.getJSON())).toEqual(tipTapToBlocks({ type: 'doc', content: [picture] }))
  })

  it('does not add a tail to empty or text-only documents, or change read-only content', () => {
    for (const content of [[{ type: 'paragraph' }], [{ type: 'examParagraph', content: [{ type: 'text', text: 'Nội dung' }] }]]) {
      const editor = setup(content)
      expect(editor.state.doc.childCount).toBe(1)
    }
    const editor = setup([picture], false)
    expect(editor.state.doc.childCount).toBe(1)
  })

  it('does not duplicate the typing tail on undo and redo', () => {
    const editor = setup()
    editor.commands.setNodeSelection(1)
    key(editor, 'Enter')
    editor.commands.insertContent('Sau ảnh')
    editor.commands.undo()
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('image')
    expect(editor.state.doc.lastChild?.content.size).toBe(0)
    editor.commands.redo()
    expect(editor.state.doc.childCount).toBe(2)
    expect(editor.state.doc.lastChild?.textContent).toBe('Sau ảnh')
  })
})
