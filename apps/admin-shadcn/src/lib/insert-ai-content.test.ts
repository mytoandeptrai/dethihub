import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { insertAiContent } from './insert-ai-content'

describe('ai insertion history', () => {
  it('inserts the entire batch in one undo step, separate from earlier typing', () => {
    const editor = new Editor({ extensions: [StarterKit], content: '<p>Original</p>' })
    editor.commands.insertContent('Earlier typing')
    const before = editor.getJSON()
    insertAiContent(
      editor,
      [1, 2].map((number) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: `Question ${number}` }],
      })),
    )
    expect(editor.getText()).toContain('Question 2')
    editor.commands.undo()
    expect(editor.getJSON()).toEqual(before)
    editor.destroy()
  })
})
