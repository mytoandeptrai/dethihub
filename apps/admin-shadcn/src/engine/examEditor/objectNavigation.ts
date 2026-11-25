import { Extension } from '@tiptap/core'
import { GapCursor } from '@tiptap/pm/gapcursor'
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorState } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

function isObject(node: ProseMirrorNode) {
  return !node.isText && (node.isAtom || (node.isBlock && !node.isTextblock))
}

function needsTypingTail(node: ProseMirrorNode | null): boolean {
  if (!node) return false
  if (isObject(node)) return true
  return !!node.lastChild && !node.lastChild.isText && node.lastChild.isAtom
}

function typingTail(state: EditorState) {
  const { doc } = state
  const last = doc.lastChild
  if (doc.childCount < 2 || last?.type.name !== 'paragraph' || last.content.size > 0) return null
  if (!needsTypingTail(doc.child(doc.childCount - 2))) return null
  return { from: doc.content.size - last.nodeSize, to: doc.content.size }
}

export function isTypingHelper(element: Element) {
  return (
    element.hasAttribute('data-typing-tail') || element.classList.contains('ProseMirror-gapcursor')
  )
}

function focusBoundary(view: EditorView, pos: number, direction: -1 | 1, empty = false) {
  const { state } = view
  const $pos = state.doc.resolve(pos)
  const adjacent = direction === 1 ? $pos.nodeAfter : $pos.nodeBefore
  const tr = state.tr
  if (adjacent?.isTextblock && (!empty || adjacent.content.size === 0)) {
    tr.setSelection(TextSelection.create(state.doc, pos + direction))
  } else if (!empty) {
    tr.setSelection(new GapCursor($pos))
  } else {
    const paragraph = state.schema.nodes.paragraph
    if (!paragraph || !$pos.parent.canReplaceWith($pos.index(), $pos.index(), paragraph))
      return false
    tr.insert(pos, paragraph.create())
    tr.setSelection(TextSelection.create(tr.doc, pos + 1))
  }
  view.dispatch(tr.scrollIntoView())
  view.focus()
  return true
}

function selectedObject(state: EditorState): NodeSelection | null {
  const { selection } = state
  if (selection instanceof NodeSelection) return isObject(selection.node) ? selection : null
  if (
    selection instanceof CellSelection &&
    selection.isRowSelection() &&
    selection.isColSelection()
  ) {
    const { $from } = selection
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'examAnswerKey')
        return NodeSelection.create(state.doc, $from.before(depth))
    }
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.spec.tableRole === 'table')
        return NodeSelection.create(state.doc, $from.before(depth))
    }
  }
  return null
}

function leaveObject(view: EditorView, direction: -1 | 1, newLine = false) {
  if (view.state.selection instanceof GapCursor) {
    return newLine ? focusBoundary(view, view.state.selection.from, direction, true) : false
  }
  const selection = selectedObject(view.state)
  const { schema } = view.state
  if (!selection) return false
  if (selection.node.isInline && !newLine) {
    const at = direction === 1 ? selection.to : selection.from
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, at)))
    return true
  }
  const { $from } = selection
  let pos = direction === 1 ? selection.to : selection.from
  let depth = $from.depth
  if (selection.node.isInline) {
    pos = direction === 1 ? $from.after(depth) : $from.before(depth)
    depth--
  }
  while (depth >= 0) {
    const $pos = view.state.doc.resolve(pos)
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), schema.nodes.paragraph)) {
      return focusBoundary(view, pos, direction, newLine)
    }
    if (depth === 0) break
    pos = direction === 1 ? $from.after(depth) : $from.before(depth)
    depth--
  }
  return false
}

export function focusBlankEditorArea(view: EditorView, event: MouseEvent) {
  if (
    !view.editable ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return false
  const target = event.target
  if (
    !(target instanceof HTMLElement) ||
    target.closest('button, input, textarea, a, .exam-image, .inline-math')
  )
    return false
  const tail = typingTail(view.state)
  const blocks: { node: ProseMirrorNode; pos: number; dom: HTMLElement }[] = []
  view.state.doc.forEach((node, pos) => {
    const dom = view.nodeDOM(pos)
    if (pos !== tail?.from && dom instanceof HTMLElement) blocks.push({ node, pos, dom })
  })
  const last = blocks.at(-1)
  if (!last) return false
  const inContent = view.dom.contains(target)
  let block =
    event.clientY > last.dom.getBoundingClientRect().bottom && !inContent ? last : undefined
  if (!block) {
    block = blocks.find(({ dom }) => {
      const image = dom.querySelector<HTMLElement>('.exam-image')
      if (!image || dom.textContent?.trim() || (target !== dom && target !== view.dom)) return false
      const bounds = image.getBoundingClientRect()
      return (
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom &&
        (event.clientX < bounds.left || event.clientX > bounds.right)
      )
    })
  }
  if (!block) return false
  if (needsTypingTail(block.node)) return focusBoundary(view, block.pos + block.node.nodeSize, 1)
  if (block.node.isTextblock) {
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, block.pos + block.node.nodeSize - 1),
      ),
    )
    view.focus()
    return true
  }
  return false
}

export const ObjectNavigation = Extension.create({
  name: 'objectNavigation',
  priority: 1100,
  onCreate() {
    if (this.editor.isEditable) this.editor.view.dispatch(this.editor.state.tr)
  },
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        appendTransaction(_transactions, _oldState, state) {
          if (!editor.isEditable || !needsTypingTail(state.doc.lastChild)) return null
          return state.tr
            .insert(state.doc.content.size, state.schema.nodes.paragraph.create())
            .setMeta('addToHistory', false)
        },
        props: {
          decorations(state) {
            const tail = typingTail(state)
            return tail
              ? DecorationSet.create(state.doc, [
                  Decoration.node(tail.from, tail.to, { 'data-typing-tail': 'true' }),
                ])
              : null
          },
          handleKeyDown(view, event) {
            if (!view.editable || event.ctrlKey || event.metaKey || event.altKey) return false
            if (event.key === 'Enter' && !event.shiftKey) return leaveObject(view, 1, true)
            if (
              !event.shiftKey &&
              ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)
            )
              return leaveObject(
                view,
                event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1,
              )
            if (event.key.length === 1 || event.key === 'Process' || event.key === 'Unidentified')
              leaveObject(view, 1, true)
            return false
          },
          handleTextInput(view, _from, _to, text) {
            if (!view.editable || !leaveObject(view, 1, true)) return false
            view.dispatch(view.state.tr.insertText(text).scrollIntoView())
            return true
          },
          handleDOMEvents: {
            compositionstart(view) {
              if (view.editable) leaveObject(view, 1, true)
              return false
            },
            beforeinput(view, event) {
              if (view.editable && event.inputType.startsWith('insert')) leaveObject(view, 1, true)
              return false
            },
            mousedown(view, event) {
              if (!focusBlankEditorArea(view, event)) return false
              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  },
})
