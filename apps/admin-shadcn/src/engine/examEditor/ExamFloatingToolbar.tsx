import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { ExamCommandGroup } from './commands'
import { syncDomSelection } from './formatState'

export function ExamFloatingToolbar({ editor, groups, onMore }: { editor: Editor | null; groups: ExamCommandGroup[]; onMore: () => void }) {
  const [selection, setSelection] = useState<{ from: number; to: number; table: boolean } | null>(null)
  const [position, setPosition] = useState({ left: 8, top: 56 })
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    const syncCaret = () => {
      if (editor.isDestroyed || editor.view.composing || !(editor.state.selection instanceof TextSelection) || editor.state.selection.empty) return
      const caret = window.getSelection()
      if (!caret?.isCollapsed || !caret.focusNode || !dom.contains(caret.focusNode)) return
      const pos = editor.view.posAtDOM(caret.focusNode, caret.focusOffset)
      editor.commands.setTextSelection(pos)
    }
    dom.addEventListener('keydown', syncCaret, true)
    dom.addEventListener('beforeinput', syncCaret, true)
    return () => { dom.removeEventListener('keydown', syncCaret, true); dom.removeEventListener('beforeinput', syncCaret, true) }
  }, [editor])
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const update = () => {
      if (editor.isDestroyed) return setSelection(null)
      const { from, to, empty } = editor.state.selection
      const table = editor.isActive('table')
      if ((!empty && editor.state.doc.textBetween(from, to).length > 0) || table) setSelection({ from, to, table })
      else setSelection(null)
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    update()
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])
  useLayoutEffect(() => {
    if (!editor || editor.isDestroyed || !selection) return
    const place = () => {
      if (editor.isDestroyed) return
      const start = editor.view.coordsAtPos(Math.min(selection.from, editor.state.doc.content.size))
      const end = editor.view.coordsAtPos(Math.min(selection.to, editor.state.doc.content.size))
      const viewport = window.visualViewport
      const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight
      const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0
      const stage = editor.view.dom.closest('.compose-scroll')?.getBoundingClientRect()
      const minLeft = Math.max(left, stage?.left ?? left) + 8
      const maxRight = Math.min(left + width, stage?.right ?? left + width) - 8
      const minTop = Math.max(top, stage?.top ?? top) + 8
      const maxBottom = Math.min(top + height - (innerWidth < 1024 ? 66 : 8), stage?.bottom ?? top + height)
      if (ref.current) ref.current.style.maxWidth = `${Math.max(1, Math.min(760, maxRight - minLeft))}px`
      const box = ref.current?.getBoundingClientRect()
      const w = box?.width ?? 350, h = box?.height ?? 44
      const above = start.top - h - 8
      setPosition({ left: Math.max(minLeft, Math.min((start.left + end.right - w) / 2, maxRight - w)), top: Math.max(minTop, Math.min(above >= minTop ? above : end.bottom + 8, maxBottom - h)) })
    }
    place()
    const observer = new ResizeObserver(place)
    if (ref.current) observer.observe(ref.current)
    const stage = editor.view.dom.closest('.compose-scroll')
    if (stage) observer.observe(stage)
    observer.observe(editor.view.dom)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    return () => { observer.disconnect(); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); window.visualViewport?.removeEventListener('resize', place); window.visualViewport?.removeEventListener('scroll', place) }
  }, [editor, selection])
  if (!selection || !editor) return null
  const ids = selection.table ? ['styles', 'font', 'paragraph', 'link', 'table'] : ['styles', 'font', 'paragraph', 'link']
  return createPortal(<div ref={ref} className="exam-floating-toolbar" role="toolbar" aria-label="Định dạng vùng chọn" style={position} onMouseDown={(event) => {
    if ((event.target as HTMLElement).closest('button')) { syncDomSelection(editor); event.preventDefault() }
  }}>{ids.map((id) => <div className={`exam-floating-group exam-floating-${id}`} key={id}>{groups.find((group) => group.id === id)?.content}</div>)}<button type="button" aria-label="Thêm định dạng" onClick={onMore}>…</button></div>, document.body)
}
