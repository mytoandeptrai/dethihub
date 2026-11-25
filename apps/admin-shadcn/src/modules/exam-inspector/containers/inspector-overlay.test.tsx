import '@testing-library/jest-dom/vitest'
import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { NodeSelection } from '@tiptap/pm/state'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'

import { useExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'
import { InspectorOverlay } from './inspector-overlay'

import type { ExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'
import type { JSONContent, Mark, Node } from '@tiptap/core'

const { BaseParagraphNode, EXAM_NODES, EXAM_MARKS } = await vi.importActual<{ BaseParagraphNode: Node; EXAM_NODES: Node[]; EXAM_MARKS: Mark[] }>('@/engine/examEditor/schema')
const { BLOCK_TEMPLATES } = await vi.importActual<{ BLOCK_TEMPLATES: { id: string; build: () => JSONContent | JSONContent[] }[] }>('@/engine/examEditor/templates')

beforeAll(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }))
const editors: { editor: Editor; element: HTMLElement }[] = []
afterEach(() => { for (const { editor, element } of editors.splice(0)) { editor.destroy(); element.remove() } })
afterAll(() => vi.unstubAllGlobals())

function setup(template: string, desktop: boolean) {
  const built = template === 'empty' ? { type: 'examAnswerKey', content: [{ type: 'paragraph' }] } : BLOCK_TEMPLATES.find(item => item.id === template)!.build()
  const content = Array.isArray(built) ? built : [built]
  if (template === 'answerKey') content[0]!.content!.unshift({ type: 'paragraph', content: [{ type: 'text', text: 'Mã đề 001' }] })
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({ element, editorProps: { handleScrollToSelection: () => true }, extensions: [StarterKit.configure({ paragraph: false, underline: false }), BaseParagraphNode, ...EXAM_NODES, ...EXAM_MARKS, Table, TableRow, TableCell, TableHeader], content: { type: 'doc', content } })
  editors.push({ editor, element })
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)))
  const dom = editor.view.nodeDOM(0) as HTMLElement
  dom.getBoundingClientRect = () => ({ top: 100, left: 100, width: 200, height: 100 }) as DOMRect
  const reveal = vi.fn()
  function Harness() { return <InspectorOverlay inspector={useExamInspector(editor, reveal, desktop)} /> }
  render(<Harness />)
  return { editor, reveal }
}

it.each([
  { desktop: true, template: 'answerKey', expected: 'Câu' },
  { desktop: false, template: 'answerKey', expected: 'Câu' },
  { desktop: false, template: 'empty', expected: '' },
])('focuses canvas text without revealing the inspector for $template (desktop=$desktop)', async ({ desktop, template, expected }) => {
  const { editor, reveal } = setup(template, desktop)
  const before = editor.getJSON()
  await userEvent.click(screen.getByTestId('inspector-badge-edit'))
  await waitFor(() => expect(editor.isFocused).toBe(true))
  expect(reveal).not.toHaveBeenCalled()
  expect(editor.view.dom).toHaveFocus()
  expect(editor.state.selection.$from.parent.type.name).toBe('paragraph')
  expect(editor.state.selection.$from.parent.textContent).toBe(expected)
  expect(editor.state.selection.$from.parentOffset).toBe(0)
  expect(editor.getJSON()).toEqual(before)
})

it.each([true, false])('still reveals writable blocks (desktop=%s)', async (desktop) => {
  const { editor, reveal } = setup('title', desktop)
  const before = editor.getJSON()
  await userEvent.click(screen.getByTestId('inspector-badge-edit'))
  expect(reveal).toHaveBeenCalledOnce()
  expect(editor.getJSON()).toEqual(before)
})

it.each(['pageBreak', 'divider', 'toc'])('reveals properties instead of focusing a replaceable %s selection', async (template) => {
  const { editor, reveal } = setup(template, false)
  const before = editor.getJSON()
  await userEvent.click(screen.getByTestId('inspector-badge-edit'))
  expect(reveal).toHaveBeenCalledOnce()
  expect(editor.view.dom).not.toHaveFocus()
  expect(editor.getJSON()).toEqual(before)
})

it('renders outside measured flow and hides while the mobile sheet covers the canvas', () => {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ top: 100, left: 100, width: 200, height: 100 }) as DOMRect
  const inspector = { editor: { isDestroyed: false, view: { nodeDOM: () => element, dom: element } }, activeInspectorBlock: { id: 'block-1', pos: 0 }, revision: 1 } as unknown as ExamInspector
  const { rerender } = render(<InspectorOverlay inspector={inspector} />)
  expect(screen.getByTestId('inspector-overlay').parentElement).toBe(document.body)
  expect(screen.getByTestId('inspector-overlay')).toHaveClass('fixed', 'print:hidden')
  expect(element.childNodes).toHaveLength(0)
  rerender(<InspectorOverlay inspector={inspector} hidden />)
  expect(screen.queryByTestId('inspector-overlay')).not.toBeInTheDocument()
})
