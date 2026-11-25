import '@testing-library/jest-dom/vitest'
import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'
import { InspectorPanel } from './inspector-panel'

import type { JSONContent, Mark, Node } from '@tiptap/core'

const { BaseParagraphNode, EXAM_NODES, EXAM_MARKS } = await vi.importActual<{ BaseParagraphNode: Node; EXAM_NODES: Node[]; EXAM_MARKS: Mark[] }>('@/engine/examEditor/schema')
const editors: Editor[] = []
const { BLOCK_TEMPLATES } = await vi.importActual<{ BLOCK_TEMPLATES: { id: string; build: () => JSONContent | JSONContent[] }[] }>('@/engine/examEditor/templates')
beforeAll(() => { Element.prototype.scrollIntoView ??= vi.fn() })
afterEach(() => { for (const editor of editors.splice(0)) editor.destroy() })

function setup(content: JSONContent[] = [{ type: 'examTitle', content: [{ type: 'text', text: 'Original' }] }, { type: 'examParagraph', content: [{ type: 'text', text: 'A paragraph' }] }]) {
  const editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit.configure({ paragraph: false, underline: false }), BaseParagraphNode, ...EXAM_NODES, ...EXAM_MARKS, Table, TableRow, TableCell, TableHeader], content: { type: 'doc', content } })
  editors.push(editor)
  function Harness() { const inspector = useExamInspector(editor, vi.fn()); return <InspectorPanel inspector={inspector} /> }
  render(<Harness />)
  return editor
}

describe('inspector panel', () => {
  it('resets stale fields when a multilevel list becomes a flat list', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'multilevel')!.build()
    const editor = setup(Array.isArray(built) ? built : [built])
    const levels = screen.getAllByTestId(/^inspector-field-levels\.\d+\.level$/)
    for (const level of levels) fireEvent.change(level, { target: { value: '0' } })
    await waitFor(() => expect(screen.queryByTestId('inspector-field-levels.0.level')).not.toBeInTheDocument())
    const ordered = !Boolean(editor.state.doc.firstChild!.attrs.ordered)
    fireEvent.change(screen.getByTestId('inspector-field-ordered'), { target: { value: String(ordered) } })
    await waitFor(() => expect(editor.state.doc.firstChild!.attrs.ordered).toBe(ordered))
  })
  for (const template of BLOCK_TEMPLATES) {
    it(`renders the ${template.id} schema`, async () => {
      const built = template.build()
      setup(Array.isArray(built) ? built : [built])
      const item = screen.getByTestId(`inspector-item-${template.id}`)
      await userEvent.click(item.querySelector('button')!)
      expect(item.querySelector('[data-panel]') ?? item).toBeVisible()
    })
  }
  it('renders a document without template nodes', () => {
    setup([{ type: 'paragraph' }])
    expect(screen.getByText('Chưa có khối mẫu. Chèn một khối để sửa thuộc tính.')).toBeVisible()
  })
  it('writes nested options and validates numeric fields without changing the document', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'question')!.build()
    const editor = setup(Array.isArray(built) ? built : [built])
    await userEvent.clear(screen.getByTestId('inspector-field-options.0.text'))
    await userEvent.type(screen.getByTestId('inspector-field-options.0.text'), 'Nested answer')
    expect(editor.state.doc.textContent).toContain('Nested answer')
    const before = editor.getJSON()
    fireEvent.change(screen.getByTestId('inspector-field-no'), { target: { value: '-3' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Giá trị không hợp lệ')
    expect(editor.getJSON()).toEqual(before)
  })
  it('renders ordered single-open items and the empty schema message', async () => {
    setup()
    expect(screen.getAllByTestId(/^inspector-item-/)).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: /Đoạn văn/ }))
    expect(await screen.findByText('Khối này không có trường để sửa')).toBeVisible()
    expect(screen.queryByLabelText('Nội dung')).not.toBeInTheDocument()
  })

  it('writes form edits without losing focus, reads canvas edits and supports form undo', async () => {
    const editor = setup()
    await userEvent.click(screen.getByRole('button', { name: /Tiêu đề đề/ }))
    const input = screen.getByTestId('inspector-field-text')
    await userEvent.clear(input)
    await userEvent.type(input, 'Form title')
    expect(editor.state.doc.firstChild!.textContent).toBe('Form title')
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true })
    await waitFor(() => expect(input).toHaveValue('Original'))
    input.blur()
    act(() => { editor.commands.setTextSelection(2); editor.commands.insertContent('Canvas') })
    await waitFor(() => expect(input).toHaveValue(editor.state.doc.firstChild!.textContent))
  })

  it('does not overwrite a focused field on an unrelated canvas transaction', async () => {
    const editor = setup()
    await userEvent.click(screen.getByRole('button', { name: /Tiêu đề đề/ }))
    const input = screen.getByTestId('inspector-field-text')
    input.focus()
    act(() => editor.commands.insertContentAt(1, 'Remote'))
    expect(input).toHaveValue('Original')
  })
})
