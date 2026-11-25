import { NodeSelection } from '@tiptap/pm/state'

import { BLOCK_SCHEMAS } from './block-registry'

import type { Editor } from '@tiptap/core'

export const INSPECTOR_INSERT_META = 'examInspectorInsertion'
export const INSPECTOR_WRITE_META = 'examInspectorWrite'
export const INSPECTOR_TEMPLATE_MIME = 'application/x-exam-template-id'

export function activateInsertedBlock(editor: Editor, pos: number, templateId?: string): void {
  if (editor.isDestroyed) return
  const entry = BLOCK_SCHEMAS.find((item) => item.id === templateId)
  let target = pos
  if (entry) {
    let found = false
    editor.state.doc.forEach((node, offset) => {
      if (!found && offset >= pos && entry.match(node)) { target = offset; found = true }
    })
  }
  if (!editor.state.doc.nodeAt(target)) return
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, target)).setMeta(INSPECTOR_INSERT_META, target))
}
