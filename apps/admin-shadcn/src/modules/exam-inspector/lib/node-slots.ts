import { Fragment } from '@tiptap/pm/model'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

export function children(node: ProseMirrorNode): ProseMirrorNode[] {
  const result: ProseMirrorNode[] = []
  node.forEach((child) => result.push(child))
  return result
}

export function withChildren(node: ProseMirrorNode, content: ProseMirrorNode[]): ProseMirrorNode {
  return node.copy(Fragment.fromArray(content))
}

export function withAttrs(node: ProseMirrorNode, attrs: Record<string, unknown>): ProseMirrorNode {
  return node.type.create({ ...node.attrs, ...attrs }, node.content, node.marks)
}

export function withText(node: ProseMirrorNode, text: string): ProseMirrorNode {
  if (node.textContent === text) return node
  let firstText: ProseMirrorNode | undefined
  node.descendants((child) => {
    if (!firstText && child.isText) firstText = child
  })
  return node.copy(
    text ? Fragment.from(node.type.schema.text(text, firstText?.marks)) : Fragment.empty,
  )
}

export function newTextNode(
  parent: ProseMirrorNode,
  type: string,
  text: string,
  attrs?: Record<string, unknown>,
): ProseMirrorNode {
  const nodeType = parent.type.schema.nodes[type]
  if (!nodeType) throw new RangeError(`Missing node type: ${type}`)
  return withText(nodeType.create(attrs), text)
}

export function patchNode(
  tr: Transaction,
  pos: number,
  before: ProseMirrorNode,
  after: ProseMirrorNode,
): Transaction {
  if (before.eq(after)) return tr
  if (before.type !== after.type) throw new RangeError('Inspector cannot replace a block type')
  if (!before.sameMarkup(after)) tr.setNodeMarkup(pos, undefined, after.attrs, after.marks)
  if (before.content.eq(after.content)) return tr
  if (
    !before.isTextblock &&
    before.childCount === after.childCount &&
    children(before).every((child, index) => child.type === after.child(index).type)
  ) {
    const offsets: number[] = []
    before.forEach((_child, offset) => offsets.push(offset))
    for (let index = before.childCount - 1; index >= 0; index--) {
      patchNode(tr, pos + 1 + offsets[index]!, before.child(index), after.child(index))
    }
    return tr
  }
  const start = before.content.findDiffStart(after.content)
  const end = before.content.findDiffEnd(after.content)
  if (start === null || !end) return tr
  const overlap = Math.max(0, start - Math.min(end.a, end.b))
  return tr.replace(pos + 1 + start, pos + 1 + end.a + overlap, after.slice(start, end.b + overlap))
}
