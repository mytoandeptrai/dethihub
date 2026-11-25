import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { afterEach, describe, expect, it } from 'vitest'

import { INSPECTOR_INSERT_META } from '@/modules/exam-inspector/lib/inspector-selection'
import { BaseParagraphNode, EXAM_MARKS, EXAM_NODES } from './schema'
import { insertBlockTemplate, templateById } from './templates'

let editor: Editor
afterEach(() => editor?.destroy())
describe('template insertion selection', () => {
  for (const id of ['header', 'title', 'student', 'rubric-header', 'passage']) {
    it(`selects and announces the ${id} anchor`, () => {
      editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit.configure({ paragraph: false, underline: false }), BaseParagraphNode, ...EXAM_MARKS, ...EXAM_NODES.filter(node => node.name !== 'examAnswerKey')], content: { type: 'doc', content: [{ type: 'paragraph' }] } })
      let inserted: number | undefined
      editor.on('transaction', ({ transaction }) => { if (transaction.getMeta(INSPECTOR_INSERT_META) !== undefined) inserted = transaction.getMeta(INSPECTOR_INSERT_META) })
      insertBlockTemplate(editor, templateById(id)!)
      expect(inserted).toBeDefined()
      expect(editor.state.selection.from).toBe(inserted)
      expect(editor.state.doc.nodeAt(inserted!)?.type.name).toBe(id === 'rubric-header' ? 'examHeading' : id === 'passage' ? 'examParagraph' : id === 'student' ? 'examStudent' : id === 'header' ? 'examHeader' : 'examTitle')
    })
  }
})
