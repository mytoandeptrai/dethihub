import { closeHistory } from '@tiptap/pm/history'

import type { Editor, JSONContent } from '@tiptap/core'

export function insertAiContent(editor: Editor, content: JSONContent[]): void {
  if (content.length === 0 || editor.isDestroyed) return
  editor.chain().command(({ tr }) => { closeHistory(tr); return true }).insertContentAt(editor.state.doc.content.size, content).run()
  editor.view.dispatch(closeHistory(editor.state.tr))
  editor.commands.focus()
}
