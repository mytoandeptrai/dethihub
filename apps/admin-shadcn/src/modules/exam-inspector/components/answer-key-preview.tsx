'use client'

import { t } from '@/i18n/translate-exam-inspector'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

function children(node: ProseMirrorNode) {
  const result: { node: ProseMirrorNode; pos: number }[] = []
  node.forEach((child, pos) => {
    result.push({ node: child, pos })
  })
  return result
}

function textPreview(node: ProseMirrorNode) {
  return node.textBetween(0, node.content.size, '\n', (leaf) =>
    leaf.type.name === 'inlineMath'
      ? `$${String(leaf.attrs.latex ?? '')}$`
      : String(leaf.attrs.alt || `[${leaf.type.name}]`),
  )
}

export function AnswerKeyPreview({ node }: { node: ProseMirrorNode }) {
  return (
    <div className="space-y-2 overflow-x-auto py-3" data-testid="inspector-answer-key-preview">
      <p className="text-xs text-slate-500">{t('examInspectorCopy.answerKeyReadOnly')}</p>
      {children(node).map(({ node: block, pos: blockPos }) =>
        block.type.name === 'table' ? (
          <table
            key={blockPos}
            className="w-full border-collapse text-left text-[11px] text-slate-700"
          >
            <tbody>
              {children(block).map(({ node: row, pos: rowPos }) => (
                <tr key={rowPos}>
                  {children(row).map(({ node: cell, pos: cellPos }) => {
                    const Cell = cell.type.name === 'tableHeader' ? 'th' : 'td'
                    return (
                      <Cell
                        key={cellPos}
                        colSpan={Number(cell.attrs.colspan) || 1}
                        rowSpan={Number(cell.attrs.rowspan) || 1}
                        className="border border-slate-200 px-2 py-1 align-top whitespace-pre-wrap"
                      >
                        {textPreview(cell)}
                      </Cell>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p key={blockPos} className="text-xs whitespace-pre-wrap text-slate-600">
            {textPreview(block)}
          </p>
        ),
      )}
    </div>
  )
}
