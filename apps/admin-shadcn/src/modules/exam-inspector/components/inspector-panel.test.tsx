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
  it('refreshes pair restrictions after a form edit changes table classification', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'answerKey')!.build() as JSONContent
    const rows = built.content![0]!.content!
    rows[0]!.content![1]!.content![0]!.content![0]!.text = 'a)'
    rows[0]!.content![2]!.content![0]!.content![0]!.text = 'b)'
    rows[1]!.content![0]!.content![0]!.content![0]!.text = '1'
    setup([built])
    const header = screen.getByTestId('inspector-field-tables.0.rows.0.cells.1.text')
    await userEvent.clear(header)
    expect(screen.getByTestId('inspector-field-tables.0.rows.1.cells.1.text')).not.toHaveRole('textbox')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('locks the answer paired with a formula number while leaving another pair editable', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'answerKey')!.build() as JSONContent
    built.content![0]!.content![0]!.content![2]!.content![0]!.content = [{ type: 'inlineMath', attrs: { latex: '2' } }]
    const editor = setup([built])
    expect(screen.getByTestId('inspector-field-tables.0.rows.1.cells.2.text')).not.toHaveRole('textbox')
    await userEvent.type(screen.getByTestId('inspector-field-tables.0.rows.1.cells.1.text'), 'C')
    expect(editor.state.doc.firstChild!.child(0).child(1).child(1).textContent).toBe('AC')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('refreshes the preview when a focused answer cell becomes read-only on the canvas', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'answerKey')!.build() as JSONContent
    const editor = setup([built])
    await userEvent.click(screen.getByTestId('inspector-field-tables.0.rows.1.cells.1.text'))
    let position = 0
    editor.state.doc.descendants((node, pos) => { if (node.type.name === 'tableCell' && node.textContent === 'A') position = pos })
    act(() => { editor.commands.insertContentAt(position + 2, { type: 'inlineMath', attrs: { latex: 'x^2' } }) })
    const preview = screen.getByTestId('inspector-field-tables.0.rows.1.cells.1.text')
    expect(preview).not.toHaveRole('textbox')
    expect(preview).toHaveTextContent('x^2')
  })
  it('displays rich answer-key cells read-only while editing adjacent plain cells', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'answerKey')!.build() as JSONContent
    built.content![0]!.content![1]!.content![2]!.content![0]!.content = [{ type: 'inlineMath', attrs: { latex: 'x^2' } }]
    const editor = setup([built])
    const rich = screen.getByTestId('inspector-field-tables.0.rows.1.cells.2.text')
    expect(rich).not.toHaveRole('textbox')
    expect(rich).toHaveTextContent('x^2')
    const original = editor.state.doc.firstChild!.child(0).child(1).child(2).toJSON()
    await userEvent.type(screen.getByTestId('inspector-field-tables.0.rows.1.cells.1.text'), 'C')
    expect(editor.state.doc.firstChild!.child(0).child(1).child(1).textContent).toBe('AC')
    expect(editor.state.doc.firstChild!.child(0).child(1).child(2).toJSON()).toEqual(original)
  })
  it('keeps the same focused textarea when heading text changes the matching schema', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'heading')!.build()
    const editor = setup(Array.isArray(built) ? built : [built])
    const input = screen.getByTestId('inspector-field-text')
    await userEvent.clear(input)
    await userEvent.type(input, 'HƯỚNG DẪN CHẤM bổ sung')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('HƯỚNG DẪN CHẤM bổ sung')
    expect(editor.state.doc.firstChild!.textContent).toBe('HƯỚNG DẪN CHẤM bổ sung')
  })
  it.each(['question', 'truefalse'])('edits only the text of fixed %s items without exposing structural controls', async (id) => {
    const built = BLOCK_TEMPLATES.find(template => template.id === id)!.build()
    const editor = setup(Array.isArray(built) ? built : [built])
    const key = id === 'question' ? 'options' : 'statements'
    expect(screen.queryByRole('button', { name: 'Thêm mục' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xoá mục' })).not.toBeInTheDocument()
    const label = screen.getByTestId(`inspector-field-${key}.0.label`)
    expect(label).toHaveTextContent(id === 'question' ? 'A' : 'a')
    expect(label).not.toHaveRole('textbox')
    await userEvent.type(screen.getByTestId(`inspector-field-${key}.0.text`), ' edited')
    expect(editor.state.doc.firstChild!.childCount).toBe(5)
    expect(editor.state.doc.firstChild!.child(1).attrs.label).toBe(id === 'question' ? 'A' : 'a')
    expect(editor.state.doc.firstChild!.child(1).textContent).toContain(' edited')
  })
  it.each(['meta', 'rubric'])('keeps the last required %s list item and permits adding/removing extras', async (id) => {
    const built = BLOCK_TEMPLATES.find(template => template.id === id)!.build()
    const editor = setup([...(Array.isArray(built) ? built : [built]), { type: 'paragraph' }])
    while (screen.getAllByRole('button', { name: 'Xoá mục' }).length > 1) {
      await userEvent.click(screen.getAllByRole('button', { name: 'Xoá mục' }).at(-1)!)
    }
    const before = editor.getJSON()
    expect(screen.getByRole('button', { name: 'Xoá mục' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Xoá mục' }))
    expect(editor.getJSON()).toEqual(before)
    await userEvent.click(screen.getByRole('button', { name: 'Thêm mục' }))
    expect(screen.getAllByRole('button', { name: 'Xoá mục' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Xoá mục' })[1]).toBeEnabled()
    await userEvent.click(screen.getAllByRole('button', { name: 'Xoá mục' })[1]!)
    expect(screen.getByRole('button', { name: 'Xoá mục' })).toBeDisabled()
    expect(editor.getJSON()).toEqual(before)
  })
  it('resets stale fields when a multilevel list becomes a flat list', async () => {
    const built = BLOCK_TEMPLATES.find(template => template.id === 'multilevel')!.build()
    const editor = setup(Array.isArray(built) ? built : [built])
    const levels = screen.getAllByTestId(/^inspector-field-levels\.\d+\.level$/)
    for (const level of levels) {
      await userEvent.clear(level)
      await userEvent.type(level, '0')
    }
    await waitFor(() => expect(screen.queryByTestId('inspector-field-levels.0.level')).not.toBeInTheDocument())
    const ordered = !editor.state.doc.firstChild!.attrs.ordered
    await userEvent.selectOptions(screen.getByTestId('inspector-field-ordered'), String(ordered))
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
