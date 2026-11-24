import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import { Command } from 'cmdk'
import { useNavigate } from '@/engine/compat/router'
import { Dialog, DialogContent, DialogTitle } from '@/engine/components/ui/dialog'
import { WORKSPACE_NAV, EXPLORE_NAV } from '@/engine/components/appNavigation'
import type { RibbonGroupDef } from './RibbonAdaptive'
import { createExamCommands, scoreExamCommand, type ExamCommand, type ExamCommandGroup } from './commands'
import { ExamFloatingToolbar } from './ExamFloatingToolbar'
import { ExamSlashMenu } from './ExamSlashMenu'
import './examChrome.css'

export function ExamCommandHost({ editor, tabs, extra, overrides, onReveal, children }: {
  editor: Editor | null
  tabs: Record<string, RibbonGroupDef[]>
  extra: ExamCommand[]
  overrides: Record<string, () => void>
  onReveal: (tab: string) => void
  children: (groups: ExamCommandGroup[]) => ReactNode
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [anchors, setAnchors] = useState<string[]>([])
  const selection = useRef<{ from: number; to: number } | null>(null)
  const registry = createExamCommands(tabs, (tab, path) => {
    onReveal(tab)
    setAnchors(path)
  }, overrides)
  const commands = [...registry.commands, ...extra, ...[...WORKSPACE_NAV, ...EXPLORE_NAV, { path: '/', label: 'Trang chủ' }].map((entry): ExamCommand => ({ id: `route:${entry.path}`, family: 'navigation', label: entry.label, group: 'Đi đến trang', tab: 'Điều hướng', run: () => navigate(entry.path) }))]

  useEffect(() => {
    if (!anchors.length) return
    let index = 0
    let frame = 0
    const next = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (index >= anchors.length) return
        const root = document.querySelector(`[data-exam-command="${CSS.escape(anchors[index])}"]`)
        const control = root?.querySelector<HTMLElement>('button,input,select')
        if (!control) return
        index++
        control.focus({ preventScroll: true })
        if (control instanceof HTMLButtonElement) control.click()
        if (index < anchors.length) next()
        else observer.disconnect()
      })
    }
    const observer = new MutationObserver(next)
    observer.observe(document.body, { childList: true, subtree: true })
    next()
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [anchors])

  useEffect(() => {
    if (!open) return
    setSearch('')
    if (editor && !editor.isDestroyed) {
      const { from, to } = editor.state.selection
      selection.current = { from, to }
    } else selection.current = null
  }, [open, editor])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const execute = (command: ExamCommand) => {
    if (command.disabled) return
    if (editor && !editor.isDestroyed && selection.current) editor.chain().focus().setTextSelection(selection.current).run()
    setOpen(false)
    command.run()
  }

  return <>
    {children(registry.groups)}
    <ExamFloatingToolbar editor={editor} groups={registry.groups} onMore={() => onReveal('home')} />
    <ExamSlashMenu editor={editor} commands={commands} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="exam-command-dialog p-0" aria-describedby={undefined} onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogTitle className="sr-only">Lệnh soạn đề</DialogTitle>
        <Command label="Lệnh soạn đề" filter={scoreExamCommand}>
          <Command.Input value={search} onValueChange={setSearch} placeholder="Tìm lệnh, định dạng hoặc trang…" aria-label="Tìm lệnh" />
          <Command.List>
            <Command.Empty>Không tìm thấy lệnh</Command.Empty>
            {[...new Set(commands.map((command) => `${command.tab} · ${command.group}`))].map((group) => <Command.Group heading={group.replace(/^home · /, 'Trang chủ · ').replace(/^insert · /, 'Chèn · ').replace(/^layout · /, 'Bố cục · ').replace(/^Tệp · Tệp$/, 'Tệp')} key={group}>
              {commands.filter((command) => `${command.tab} · ${command.group}` === group).map((command) => <Command.Item key={command.id} value={command.id} keywords={[command.label, ...command.keywords ?? []]} disabled={command.disabled} onSelect={() => execute(command)}>{command.label}</Command.Item>)}
            </Command.Group>)}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  </>
}
