'use client'

import { closeHistory } from '@tiptap/pm/history'
import { NodeSelection } from '@tiptap/pm/state'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import { matchBlockSchema } from '@/modules/exam-inspector/lib/block-registry'
import { INSPECTOR_INSERT_META, INSPECTOR_WRITE_META } from '@/modules/exam-inspector/lib/inspector-selection'

import type { BlockSchema } from '@/modules/exam-inspector/lib/block-registry'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

export interface InspectorBlock { id: string; pos: number; node: ProseMirrorNode; schema: BlockSchema }
interface InspectorState {
  blocks: InspectorBlock[]
  activeInspectorBlock: InspectorBlock | null
  origin: 'canvas' | 'form' | 'history'
  revision: number
}
const EMPTY: InspectorState = { blocks: [], activeInspectorBlock: null, origin: 'canvas', revision: 0 }

function selectedPosition(editor: Editor): number {
  const { $from, from } = editor.state.selection
  return $from.depth ? $from.before(1) : from
}

export function useExamInspector(editor: Editor | null, onReveal: () => void) {
  const store = useMemo(() => createStore<InspectorState>(() => EMPTY), [])
  const state = useStore(store)
  const reveal = useRef(onReveal)
  reveal.current = onReveal
  const lastWrite = useRef<{ id: string; field: string; at: number } | null>(null)
  const history = useRef(false)
  const serial = useRef(0)

  useEffect(() => {
    lastWrite.current = null
    store.setState(EMPTY)
    if (!editor || editor.isDestroyed) return
    const refresh = (tr?: Transaction) => {
      const previous = store.getState()
      const old = new Map(previous.blocks.map((block) => [tr ? tr.mapping.map(block.pos, 1) : block.pos, block]))
      const ownWrite = Boolean(tr?.getMeta(INSPECTOR_WRITE_META))
      const blocks: InspectorBlock[] = []
      editor.state.doc.forEach((node, pos) => {
        const prior = old.get(pos)
        let schema = matchBlockSchema(node)
        if (prior && prior.id === previous.activeInspectorBlock?.id && ['passage', 'rubric-header', 'end'].includes(prior.schema.id) && prior.node.type === node.type) schema = prior.schema
        if (schema) blocks.push({ id: prior?.node.type === node.type ? prior.id : `block-${++serial.current}`, pos, node, schema })
      })
      const inserted = tr?.getMeta(INSPECTOR_INSERT_META) as number | undefined
      const keepForm = ownWrite && previous.activeInspectorBlock ? tr!.mapping.map(previous.activeInspectorBlock.pos, 1) : null
      const pos = inserted ?? keepForm ?? selectedPosition(editor)
      store.setState({ blocks, activeInspectorBlock: blocks.find((block) => block.pos === pos) ?? null, origin: history.current ? 'history' : ownWrite ? 'form' : 'canvas', revision: previous.revision + 1 })
      if (inserted !== undefined) reveal.current()
    }
    const transaction = ({ transaction: tr }: { transaction: Transaction }) => refresh(tr)
    const click = () => { refresh(); if (store.getState().activeInspectorBlock) reveal.current() }
    refresh()
    editor.on('transaction', transaction)
    const dom = editor.view.dom
    dom.addEventListener('click', click)
    return () => { editor.off('transaction', transaction); dom.removeEventListener('click', click); store.setState(EMPTY) }
  }, [editor, store])

  const activate = useCallback((id: string) => {
    const block = store.getState().blocks.find((item) => item.id === id)
    if (!editor || editor.isDestroyed || !block) return
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, block.pos)))
  }, [editor, store])

  const writeValues = useCallback((id: string, values: Record<string, unknown>, field: string) => {
    const block = store.getState().blocks.find((item) => item.id === id)
    if (!editor || editor.isDestroyed || !block || !block.schema.schema.safeParse(values).success) return
    const tr = block.schema.write(editor.state.tr, block.pos, block.node, values)
    if (!tr.docChanged) return
    const last = lastWrite.current
    if (!last || last.id !== id || last.field !== field || Date.now() - last.at > 1000) closeHistory(tr)
    lastWrite.current = { id, field, at: Date.now() }
    editor.view.dispatch(tr.setMeta(INSPECTOR_WRITE_META, id))
  }, [editor, store])

  const undo = useCallback((redo = false) => {
    if (!editor || editor.isDestroyed) return
    lastWrite.current = null
    history.current = true
    try { if (redo) editor.commands.redo(); else editor.commands.undo() } finally { history.current = false }
  }, [editor])

  const deleteActive = useCallback(() => {
    const active = store.getState().activeInspectorBlock
    if (!editor || editor.isDestroyed || !active) return
    editor.view.dispatch(closeHistory(editor.state.tr).delete(active.pos, active.pos + active.node.nodeSize))
    store.setState({ activeInspectorBlock: null })
    lastWrite.current = null
  }, [editor, store])

  return { ...state, editor, activate, writeValues, undo, deleteActive, reveal: () => reveal.current() }
}

export type ExamInspector = ReturnType<typeof useExamInspector>
