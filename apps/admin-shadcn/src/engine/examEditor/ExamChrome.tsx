import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@/engine/compat/router'
import type { Editor } from '@tiptap/core'
import { Command } from 'cmdk'
import { AlignLeft, FileText, ListTree, Search, Sparkles, Type, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/engine/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/engine/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/engine/components/ui/tooltip'
import { WORKSPACE_NAV, EXPLORE_NAV } from '@/engine/components/appNavigation'
import type { RibbonGroupDef } from './RibbonAdaptive'
import { createExamCommands, scoreExamCommand, type ExamCommand } from './commands'
import { ExamFloatingToolbar } from './ExamFloatingToolbar'
import { ExamSlashMenu } from './ExamSlashMenu'
import './examChrome.css'

export type ExamPanel = 'home' | 'insert' | 'layout' | 'nav' | null
export const EXAM_PANEL_KEY = 'dethihub.exam-tool-panel'
export function readExamPanel(): ExamPanel {
  try { const value = localStorage.getItem(EXAM_PANEL_KEY); return ['home', 'insert', 'layout', 'nav'].includes(value ?? '') ? value as ExamPanel : null } catch { return null }
}
export interface ExamChromeOptions {
  panel: ExamPanel
  onPanel: (panel: ExamPanel) => void
  nav: ReactNode
  navTitle: string
  onNav: () => void
  onFind: () => void
  onAi: () => void
  commandOpen: boolean
  onCommandOpen: (open: boolean) => void
  fileTarget: HTMLElement | null
  mobile: boolean
}

const PANELS = [
  { id: 'home' as const, label: 'Văn bản', Icon: Type },
  { id: 'insert' as const, label: 'Chèn', Icon: AlignLeft },
  { id: 'layout' as const, label: 'Trang', Icon: FileText },
  { id: 'nav' as const, label: 'Mục lục', Icon: ListTree },
]

function groupHeading(group: string) {
  return group.replace(/^home · /, 'Trang chủ · ').replace(/^insert · /, 'Chèn · ').replace(/^layout · /, 'Bố cục · ').replace(/^Tệp · Tệp$/, 'Tệp')
}

export function ExamChrome({ editor, tabs, options, fileMenu, extra, overrides }: {
  editor: Editor | null
  tabs: Record<string, RibbonGroupDef[]>
  options: ExamChromeOptions
  fileMenu: ReactNode
  extra: ExamCommand[]
  overrides: Record<string, () => void>
}) {
  const { panel, onPanel, mobile, commandOpen, onCommandOpen } = options
  const navigate = useNavigate()
  const [keyboard, setKeyboard] = useState(0)
  const [search, setSearch] = useState('')
  const selection = useRef<{ from: number; to: number } | null>(null)
  const reveal = (tab: string, anchors: string[]) => {
    onPanel(tab as ExamPanel)
    let i = 0
    const next = () => {
      const root = document.querySelector(`[data-exam-command="${CSS.escape(anchors[i])}"]`)
      const control = root?.querySelector<HTMLElement>('button,input,select')
      if (control) {
        control.focus({ preventScroll: true })
        if (control instanceof HTMLButtonElement) control.click()
      }
      if (++i < anchors.length) requestAnimationFrame(next)
    }
    requestAnimationFrame(next)
  }
  const registry = createExamCommands(tabs, reveal, overrides)
  const commands = [...registry.commands, ...extra, ...[...WORKSPACE_NAV, ...EXPLORE_NAV, { path: '/', label: 'Trang chủ' }].map((entry): ExamCommand => ({ id: `route:${entry.path}`, family: 'navigation', label: entry.label, group: 'Đi đến trang', tab: 'Điều hướng', run: () => navigate(entry.path) }))]
  const savedEditor = useRef(editor)
  savedEditor.current = editor
  const execute = (command: ExamCommand) => {
    if (command.disabled) return
    const live = savedEditor.current
    if (live && !live.isDestroyed && selection.current) live.chain().focus().setTextSelection(selection.current).run()
    onCommandOpen(false)
    command.run()
  }
  useEffect(() => {
    if (commandOpen && editor && !editor.isDestroyed) {
      const { from, to } = editor.state.selection
      selection.current = { from, to }
      setSearch('')
    }
  }, [commandOpen, editor])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onCommandOpen(!commandOpen)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [commandOpen, onCommandOpen])
  useEffect(() => {
    const update = () => setKeyboard(Math.max(0, innerHeight - (visualViewport?.height ?? innerHeight) - (visualViewport?.offsetTop ?? 0)))
    update()
    visualViewport?.addEventListener('resize', update)
    visualViewport?.addEventListener('scroll', update)
    return () => { visualViewport?.removeEventListener('resize', update); visualViewport?.removeEventListener('scroll', update) }
  }, [])
  const content = panel === 'nav' ? options.nav : <div className="exam-tool-sections">{registry.groups.filter((group) => group.tab === panel).map((group) => <section key={group.id} data-exam-group={group.id}><h3>{group.label}</h3><div className="exam-tool-grid" onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault() }}>{group.content}</div></section>)}{panel === 'insert' && <section><h3>Thư viện</h3>{extra.filter((command) => ['nav.templates', 'nav.tools'].includes(command.id)).map((command) => <button className="exam-library-command" key={command.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={command.run}>{command.label}</button>)}</section>}</div>
  const title = panel === 'nav' ? options.navTitle : PANELS.find((entry) => entry.id === panel)?.label ?? 'Công cụ'
  return <>
    {options.fileTarget && createPortal(fileMenu, options.fileTarget)}
    <TooltipProvider delayDuration={200}><nav className="exam-tool-rail" aria-label="Công cụ soạn đề" style={mobile ? { bottom: keyboard } : undefined}>
      {PANELS.map(({ id, label, Icon }) => <Tooltip key={id}><TooltipTrigger asChild><button type="button" aria-label={label} aria-pressed={panel === id} onMouseDown={(event) => event.preventDefault()} onClick={() => panel === id ? onPanel(null) : id === 'nav' ? options.onNav() : onPanel(id)}><Icon size={19} /><span>{label}</span></button></TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>)}
      <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Tìm kiếm" onClick={options.onFind}><Search size={19} /><span>Tìm kiếm</span></button></TooltipTrigger><TooltipContent side="right">Tìm kiếm và thay thế</TooltipContent></Tooltip>
      <button type="button" className="exam-mobile-ai" aria-label="AI" onClick={options.onAi}><Sparkles size={19} /><span>AI</span></button>
    </nav></TooltipProvider>
    {mobile ? <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) onPanel(null) }} modal={false}>
      <SheetContent side="bottom" className="exam-tool-sheet" style={{ bottom: `calc(${keyboard + 58}px + env(safe-area-inset-bottom))`, maxHeight: `calc(100dvh - ${keyboard + 110}px - env(safe-area-inset-bottom))` }}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => { if (event.target instanceof Element && event.target.closest('[data-portal-child], .exam-tool-rail')) event.preventDefault() }}
        aria-describedby={undefined}>
        <SheetTitle>{title}</SheetTitle>{content}
      </SheetContent>
    </Sheet> : <aside className="exam-tool-panel" style={{ width: panel ? 300 : 0 }} aria-label={title} inert={!panel}><div className="exam-tool-panel-inner"><header><h2>{title}</h2><button type="button" aria-label="Đóng công cụ" onClick={() => onPanel(null)}><X size={16} /></button></header>{panel && content}</div></aside>}
    <ExamFloatingToolbar editor={editor} groups={registry.groups} onMore={() => onPanel('home')} />
    <ExamSlashMenu editor={editor} commands={commands} />
    <Dialog open={commandOpen} onOpenChange={onCommandOpen}>
      <DialogContent className="exam-command-dialog p-0" aria-describedby={undefined} onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogTitle className="sr-only">Lệnh soạn đề</DialogTitle>
        <Command label="Lệnh soạn đề" filter={scoreExamCommand}>
          <Command.Input value={search} onValueChange={setSearch} placeholder="Tìm lệnh, định dạng hoặc trang…" aria-label="Tìm lệnh" />
          <Command.List>
            <Command.Empty>Không tìm thấy lệnh</Command.Empty>
            {[...new Set(commands.map((command) => `${command.tab} · ${command.group}`))].map((group) => <Command.Group heading={groupHeading(group)} key={group}>
              {commands.filter((command) => `${command.tab} · ${command.group}` === group).map((command) => <Command.Item key={command.id} value={command.id} keywords={[command.label, ...command.keywords ?? []]} disabled={command.disabled} onSelect={() => execute(command)}>{command.label}</Command.Item>)}
            </Command.Group>)}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  </>
}
