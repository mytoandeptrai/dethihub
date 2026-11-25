import { Command } from 'cmdk'
import { Type, Plus, Palette, ArrowRightLeft, Sparkles, MonitorPlay, Eye, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'

import { Dialog, DialogContent, DialogTitle } from '@/engine/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/engine/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/engine/components/ui/tooltip'

import { createExamCommands, scoreExamCommand, type ExamCommand } from './commands'

import type { RibbonGroupDef } from './RibbonAdaptive'
import type { SlideElement } from '@/engine/store/docs'
import './slideChrome.css'

export interface SlideChromeOptions {
  panel: string | null
  onPanel: (panel: string | null) => void
  railTarget: HTMLElement | null
  panelTarget: HTMLElement | null
  fileTarget: HTMLElement | null
  commandOpen: boolean
  onCommandOpen: (open: boolean) => void
  onTextFocus: (id: string) => void
}
const ENTRIES = [
  ['home', 'Trang chủ', Type],
  ['insert', 'Chèn', Plus],
  ['design', 'Thiết kế', Palette],
  ['transitions', 'Chuyển tiếp', ArrowRightLeft],
  ['animations', 'Hoạt ảnh', Sparkles],
  ['slideShow', 'Trình chiếu', MonitorPlay],
  ['view', 'Xem', Eye],
] as const

export function SlideChrome({
  options,
  tabs,
  fileMenu,
  extra,
  selected,
  context,
}: {
  options: SlideChromeOptions
  tabs: Record<string, RibbonGroupDef[]>
  fileMenu: ReactNode
  extra: ExamCommand[]
  selected: SlideElement | null
  context: string
}) {
  const [search, setSearch] = useState('')
  const [keyboard, setKeyboard] = useState(0)
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
  )
  const textSelection = useRef<{
    id: string
    start: number
    end: number
    direction: 'forward' | 'backward' | 'none'
  } | null>(null)
  const { panel, onPanel, commandOpen, onCommandOpen } = options
  const reveal = (tab: string, anchors: string[]) => {
    onPanel(tab)
    let index = 0
    const next = () => {
      const root =
        options.panelTarget?.querySelector(`[data-exam-command="${CSS.escape(anchors[index])}"]`) ??
        document.querySelector(
          `.slide-tool-sheet [data-exam-command="${CSS.escape(anchors[index])}"]`,
        )
      const control = root?.querySelector<HTMLElement>('button,input,select')
      control?.focus({ preventScroll: true })
      if (control instanceof HTMLButtonElement) control.click()
      if (++index < anchors.length) requestAnimationFrame(next)
    }
    requestAnimationFrame(next)
  }
  const registry = createExamCommands(tabs, reveal)
  const commands = [...registry.commands, ...extra]
  const runCommand = (command: ExamCommand) => {
    onCommandOpen(false)
    if (tabs[command.tab]) onPanel(command.tab)
    const saved = textSelection.current
    requestAnimationFrame(() => {
      if (!saved || saved.id !== selected?.id) return command.run()
      flushSync(() => options.onTextFocus(saved.id))
      const textarea = document.querySelector<HTMLTextAreaElement>(
        `.slide-frame [data-el-id="${CSS.escape(saved.id)}"] textarea`,
      )
      textarea?.focus()
      textarea?.setSelectionRange(saved.start, saved.end, saved.direction)
      command.run()
    })
  }
  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const textarea = event.target
      if (
        !(textarea instanceof HTMLTextAreaElement) ||
        textarea.readOnly ||
        !textarea.closest('.slide-frame')
      )
        return
      const id = textarea.closest('[data-el-id]')?.getAttribute('data-el-id')
      if (id)
        textSelection.current = {
          id,
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
          direction: textarea.selectionDirection,
        }
    }
    document.addEventListener('focusout', remember, true)
    return () => document.removeEventListener('focusout', remember, true)
  }, [])
  useEffect(() => {
    const update = () => {
      setMobile(innerWidth < 1024)
      setKeyboard(
        Math.max(
          0,
          innerHeight - (visualViewport?.height ?? innerHeight) - (visualViewport?.offsetTop ?? 0),
        ),
      )
    }
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onCommandOpen(!commandOpen)
      }
    }
    window.addEventListener('keydown', key)
    window.addEventListener('resize', update)
    visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('resize', update)
      visualViewport?.removeEventListener('resize', update)
    }
  }, [commandOpen, onCommandOpen])
  useEffect(() => {
    if (commandOpen) setSearch('')
  }, [commandOpen])
  const content = (
    <div className="slide-tool-sections">
      {registry.groups
        .filter((group) => group.tab === panel)
        .map((group) => (
          <section key={group.id} data-slide-group={group.id}>
            <h3>{group.label}</h3>
            <div className="slide-tool-grid">{group.content}</div>
          </section>
        ))}
    </div>
  )
  const title = ENTRIES.find(([id]) => id === panel)?.[1] ?? 'Định dạng'
  const floating = registry.groups.filter(
    (group) =>
      group.tab === context &&
      (context !== 'home' || ['Phông', 'Phông chữ', 'Đoạn văn'].includes(group.label)),
  )
  return (
    <>
      {options.fileTarget && createPortal(fileMenu, options.fileTarget)}
      {options.railTarget &&
        createPortal(
          <TooltipProvider delayDuration={200}>
            {ENTRIES.map(([id, label, Icon]) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    className="slide-tool-entry"
                    type="button"
                    aria-label={label}
                    aria-pressed={panel === id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onPanel(panel === id ? null : id)}
                  >
                    <Icon size={19} />
                    <span>{label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>,
          options.railTarget,
        )}
      {mobile ? (
        <Sheet
          open={panel !== null}
          onOpenChange={(open) => {
            if (!open) onPanel(null)
          }}
          modal={false}
        >
          <SheetContent
            className="slide-tool-sheet"
            side="bottom"
            style={{ bottom: keyboard + 56, maxHeight: `calc(100dvh - ${keyboard + 110}px)` }}
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onFocusOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.slide-tool-entry, [data-portal-child], .slide-ribbon-menu')
              )
                event.preventDefault()
            }}
          >
            <SheetTitle>{title}</SheetTitle>
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        options.panelTarget &&
        createPortal(
          <aside className="slide-tool-panel" style={{ width: panel ? 300 : 0 }} inert={!panel}>
            <header>
              <h2>{title}</h2>
              <button type="button" aria-label="Đóng công cụ slide" onClick={() => onPanel(null)}>
                <X size={16} />
              </button>
            </header>
            {panel && content}
          </aside>,
          options.panelTarget,
        )
      )}
      {selected && (
        <SlideElementToolbar
          selected={selected}
          content={floating.map((group) => (
            <div className="slide-context-group" key={group.id}>
              {group.content}
            </div>
          ))}
          onMore={() => onPanel(context)}
        />
      )}
      <Dialog open={commandOpen} onOpenChange={onCommandOpen}>
        <DialogContent
          className="slide-command-dialog p-0"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle className="sr-only">Lệnh slide</DialogTitle>
          <Command filter={scoreExamCommand}>
            <Command.Input
              aria-label="Tìm lệnh slide"
              placeholder="Tìm lệnh slide…"
              value={search}
              onValueChange={setSearch}
            />
            <Command.List>
              <Command.Empty>Không tìm thấy lệnh</Command.Empty>
              {[...new Set(commands.map((command) => `${command.tab} · ${command.group}`))].map(
                (group) => (
                  <Command.Group key={group} heading={group}>
                    {commands
                      .filter((command) => `${command.tab} · ${command.group}` === group)
                      .map((command) => (
                        <Command.Item
                          key={command.id}
                          value={command.id}
                          keywords={[command.label, ...(command.keywords ?? [])]}
                          disabled={command.disabled}
                          onSelect={() => runCommand(command)}
                        >
                          {command.label}
                        </Command.Item>
                      ))}
                  </Command.Group>
                ),
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SlideElementToolbar({
  selected,
  content,
  onMore,
}: {
  selected: SlideElement
  content: ReactNode
  onMore: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 8, top: 100 })
  useLayoutEffect(() => {
    const place = () => {
      const element = document.querySelector(
        `.slide-frame [data-el-id="${CSS.escape(selected.id)}"]`,
      )
      if (!element || !ref.current) return
      const rect = element.getBoundingClientRect(),
        toolbar = ref.current.getBoundingClientRect()
      const viewport = visualViewport,
        left = viewport?.offsetLeft ?? 0,
        top = viewport?.offsetTop ?? 0
      const stage = document.querySelector('.slide-stage')?.getBoundingClientRect()
      const minimumLeft = Math.max(left + 8, (stage?.left ?? 0) + 8)
      ref.current.style.maxWidth = `${Math.max(120, left + (viewport?.width ?? innerWidth) - minimumLeft - 8)}px`
      setPosition({
        left: Math.max(
          minimumLeft,
          Math.min(rect.left, left + (viewport?.width ?? innerWidth) - toolbar.width - 8),
        ),
        top: Math.max(
          top + 100,
          Math.min(
            rect.top - toolbar.height - 12,
            top + (viewport?.height ?? innerHeight) - toolbar.height - 70,
          ),
        ),
      })
    }
    place()
    const observer = new ResizeObserver(place)
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    const frame = document.querySelector('.slide-frame')
    if (frame) observer.observe(frame)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [selected])
  return createPortal(
    <div
      className="slide-element-toolbar"
      role="toolbar"
      aria-label="Định dạng đối tượng"
      ref={ref}
      style={position}
      onMouseDown={(event) => {
        if ((event.target as Element).closest('button')) event.preventDefault()
      }}
    >
      {content}
      <button type="button" aria-label="Thêm định dạng slide" onClick={onMore}>
        …
      </button>
    </div>,
    document.body,
  )
}
