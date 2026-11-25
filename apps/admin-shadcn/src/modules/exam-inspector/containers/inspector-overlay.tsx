'use client'

import { TextSelection } from '@tiptap/pm/state'
import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { t } from '@/i18n/translate'

import type { ExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'
import type { InspectorField } from '@/modules/exam-inspector/lib/block-registry'

function hasWritableFields(fields: InspectorField[]): boolean {
  return fields.some(
    (field) => !field.readOnly && (field.kind !== 'list' || hasWritableFields(field.fields ?? [])),
  )
}

export function InspectorOverlay({
  inspector,
  hidden = false,
}: {
  inspector: ExamInspector
  hidden?: boolean
}) {
  const [rect, setRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const { editor, activeInspectorBlock: active, revision } = inspector
  useLayoutEffect(() => {
    if (hidden || !editor || editor.isDestroyed || !active) {
      setRect(null)
      return
    }
    const element = editor.view.nodeDOM(active.pos)
    if (!(element instanceof HTMLElement)) {
      setRect(null)
      return
    }
    let frame = 0
    const measure = () => {
      const box = element.getBoundingClientRect()
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(editor.view.dom)
    observer.observe(element)
    window.addEventListener('resize', schedule)
    document.addEventListener('scroll', schedule, true)
    document.addEventListener('transitionend', schedule, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      document.removeEventListener('scroll', schedule, true)
      document.removeEventListener('transitionend', schedule, true)
    }
  }, [editor, active, revision, hidden])
  const edit = () => {
    if (!editor || editor.isDestroyed || !active) return
    if (!hasWritableFields(active.schema.fields)) {
      let start = active.pos + 1
      let foundCell = false
      active.node.descendants((node, pos) => {
        if (foundCell) return false
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          start = active.pos + pos + 2
          foundCell = true
          return false
        }
        return true
      })
      const selection = TextSelection.findFrom(editor.state.doc.resolve(start), 1, true)
      if (selection && selection.from < active.pos + active.node.nodeSize) {
        const current = editor.state.selection
        const inside = current.from > active.pos && current.to < active.pos + active.node.nodeSize
        editor.commands.focus(inside ? undefined : selection.from)
        return
      }
    }
    inspector.reveal()
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          '[data-inspector-active="true"] input, [data-inspector-active="true"] textarea',
        )
        ?.focus(),
    )
  }
  if (
    hidden ||
    !rect ||
    !active ||
    rect.width === 0 ||
    rect.top > window.innerHeight ||
    rect.top + rect.height < 0
  )
    return null
  return createPortal(
    <div
      data-testid="inspector-overlay"
      className="pointer-events-none fixed z-20 rounded-sm outline-2 outline-offset-2 outline-indigo-500 print:hidden"
      style={rect}
    >
      <div
        className="pointer-events-auto absolute -top-7 right-0 flex rounded-md border border-indigo-200 bg-white text-xs text-indigo-700 shadow-sm"
        onMouseDown={(event) => event.preventDefault()}
      >
        <button
          type="button"
          data-testid="inspector-badge-edit"
          className="px-2 py-1 hover:bg-indigo-50"
          onClick={edit}
        >
          {t('examInspectorCopy.edit')}
        </button>
        <button
          type="button"
          data-testid="inspector-badge-delete"
          className="border-l border-indigo-100 px-2 py-1 hover:bg-indigo-50"
          onClick={inspector.deleteActive}
        >
          {t('examInspectorCopy.delete')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
