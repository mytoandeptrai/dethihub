import { Plugin, PluginKey } from '@tiptap/pm/state'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { normalizeCommand, readSlashQuery, type ExamCommand } from './commands'

import type { Editor } from '@tiptap/core'

const slashKey = new PluginKey('exam-slash-ui')
type SlashRange = { from: number; to: number; query: string; left: number; top: number }

export function ExamSlashMenu({
  editor,
  commands,
}: {
  editor: Editor | null
  commands: ExamCommand[]
}) {
  const [range, setRange] = useState<SlashRange | null>(null)
  const [active, setActive] = useState(0)
  const activeIndex = useRef(active)
  activeIndex.current = active
  const current = useRef(range)
  current.current = range
  const dismissed = useRef<number | null>(null)
  const candidates = commands.filter(
    (command) =>
      !command.disabled &&
      !command.id.includes(':item:') &&
      /^(Bảng$|Công thức$|Hình vẽ$|Đồ thị|Ảnh$|Kho câu hỏi$|Mẫu|Ngắt trang$|Ký hiệu$|Liên kết$|Tiêu đề [123]$|Danh sách)/u.test(
        command.label,
      ),
  )
  const matches = candidates
    .filter((command) =>
      normalizeCommand(command.label).includes(normalizeCommand(range?.query ?? '')),
    )
    .slice(0, 16)
  const matching = useRef(matches)
  matching.current = matches
  const run = useRef<(command: ExamCommand) => void>(() => {})
  run.current = (command) => {
    const selected = current.current
    if (!editor || editor.isDestroyed || !selected) return
    current.current = null
    setRange(null)
    editor.chain().focus().deleteRange({ from: selected.from, to: selected.to }).run()
    command.run()
  }
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const update = () => {
      if (editor.isDestroyed || editor.view.composing) return
      const { $from, empty } = editor.state.selection
      const text = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
      const query = readSlashQuery(
        text,
        $from.parent.type.name,
        empty,
        $from.parentOffset < $from.parent.content.size,
      )
      if (query === null) {
        dismissed.current = null
        current.current = null
        setRange(null)
        return
      }
      const from = $from.pos - query.length - 1
      if (dismissed.current === from) return
      const coords = editor.view.coordsAtPos($from.pos)
      const next = { from, to: $from.pos, query, left: coords.left, top: coords.bottom + 6 }
      current.current = next
      setRange(next)
      setActive(0)
    }
    const plugin = new Plugin({
      key: slashKey,
      view: () => ({ update }),
      props: {
        handleKeyDown: (_view, event) => {
          if (!current.current || event.isComposing || event.keyCode === 229) return false
          if (event.key === 'Escape') {
            dismissed.current = current.current.from
            current.current = null
            setRange(null)
            event.preventDefault()
            return true
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setActive(
              (value) =>
                (value +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  Math.max(1, matching.current.length)) %
                Math.max(1, matching.current.length),
            )
            return true
          }
          if (event.key === 'Enter' && matching.current.length) {
            event.preventDefault()
            run.current(
              matching.current[Math.min(activeIndex.current, matching.current.length - 1)],
            )
            return true
          }
          return false
        },
        handleDOMEvents: {
          blur: () => {
            current.current = null
            setRange(null)
            return false
          },
        },
      },
    })
    editor.registerPlugin(plugin, (next, plugins) => [next, ...plugins])
    return () => {
      if (!editor.isDestroyed) editor.unregisterPlugin(slashKey)
    }
  }, [editor])
  if (!range) return null
  const viewport = window.visualViewport
  const width = viewport?.width ?? innerWidth,
    height = viewport?.height ?? innerHeight
  const left = viewport?.offsetLeft ?? 0,
    top = viewport?.offsetTop ?? 0
  return createPortal(
    <div
      role="listbox"
      aria-label="Chèn nhanh"
      className="exam-slash-menu"
      style={{
        left: Math.max(
          left + 8,
          Math.min(range.left, left + width - Math.min(320, width - 16) - 8),
        ),
        top: Math.max(top + 52, Math.min(range.top, top + height - 300)),
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {matches.length ? (
        matches.map((command, index) => (
          <button
            type="button"
            role="option"
            aria-selected={index === active}
            key={command.id}
            onClick={() => run.current(command)}
          >
            {command.label}
          </button>
        ))
      ) : (
        <p>Không có lệnh phù hợp</p>
      )}
    </div>,
    document.body,
  )
}
