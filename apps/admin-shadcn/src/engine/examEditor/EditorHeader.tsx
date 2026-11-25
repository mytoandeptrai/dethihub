import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@/engine/compat/router'
import { ChevronDown, ChevronRight, Command, Download, Eye, Save } from 'lucide-react'
import { Button } from '@/engine/components/ui/button'
import { Input } from '@/engine/components/ui/input'
import { Badge } from '@/engine/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/engine/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/engine/components/ui/tooltip'
import { DOC_STATUS_LABELS, docStatus, type DocStatus } from '@/engine/lib/docStatus'

function Hint({ label, children }: { label: string; children: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="bottom">{label}</TooltipContent></Tooltip>
}

export function EditorHeader({ title, dirty, status, onRename, onStatusChange, onSave, onPreview, previewLabel = 'Xem trước', previewIcon = <Eye className="size-4" />, exports, fileSlot, onCommands, previewEmphasis = false, readOnly = false }: {
  readOnly?: boolean
  previewEmphasis?: boolean
  fileSlot?: (element: HTMLSpanElement | null) => void
  onCommands?: () => void
  title: string
  dirty: boolean
  status?: DocStatus
  onRename: (title: string) => void
  onStatusChange?: (status: DocStatus) => void
  onSave: () => void
  onPreview?: () => void
  previewLabel?: string
  previewIcon?: ReactNode
  exports: Array<{ label: string; onSelect: () => void }>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef(false)
  useEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    }
  }, [editing])
  const finish = (save: boolean) => {
    if (!pending.current) return
    pending.current = false
    setEditing(false)
    const next = draft.trim()
    if (save && next && next !== title) onRename(next)
  }
  const savedLabel = dirty ? 'Chưa lưu' : 'Đã lưu'

  return <TooltipProvider delayDuration={250}>
    <header data-editor-header className="flex h-12 min-h-12 min-w-0 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 text-ink sm:px-4 print:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {!readOnly && onCommands && <><span ref={fileSlot} className="shrink-0" /><Button type="button" variant="ghost" size="sm" className="size-8 shrink-0 px-0 sm:w-auto sm:px-2" aria-label="Lệnh (Ctrl K)" onClick={onCommands}><Command className="size-4" /><span className="hidden sm:inline">Lệnh</span></Button></>}
        <Link to="/de-cua-toi" className="hidden shrink-0 text-xs font-medium text-ink-3 hover:text-clay sm:inline">Đề của tôi</Link>
        <ChevronRight className="hidden size-3.5 shrink-0 text-ink-4 sm:block" aria-hidden />
        {editing ? <Input
          ref={input}
          aria-label="Tên tài liệu"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') { e.preventDefault(); finish(true) }
            if (e.key === 'Escape') { e.preventDefault(); finish(false) }
          }}
          className="h-8 min-w-0 max-w-80 flex-1 px-2 py-1 text-sm font-semibold"
        /> : <button
          type="button"
          disabled={readOnly}
          aria-label={`Đổi tên: ${title}`}
          className="min-w-0 truncate rounded-md px-1 py-1 text-left text-sm font-semibold hover:bg-sunken"
          onClick={() => { setDraft(title); pending.current = true; setEditing(true) }}
        >{title}</button>}
        {!readOnly && onStatusChange && <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge asChild variant="outline" className="shrink-0 gap-1 border-line bg-sunken px-2 py-1 text-[11px] font-medium text-ink-2 hover:bg-clay-tint hover:text-clay">
              <button type="button" aria-label="Trạng thái tài liệu">{DOC_STATUS_LABELS[docStatus(status)]}<ChevronDown className="size-3" aria-hidden /></button>
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={docStatus(status)} onValueChange={(value) => onStatusChange(docStatus(value))}>
              {(Object.keys(DOC_STATUS_LABELS) as DocStatus[]).map((value) => <DropdownMenuRadioItem key={value} value={value}>{DOC_STATUS_LABELS[value]}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span role="status" className="hidden text-[11px] text-ink-3 lg:inline">{savedLabel}</span>
        {onPreview && <Hint label={previewLabel}><Button type="button" variant={previewEmphasis ? 'default' : 'ghost'} size="sm" aria-label={previewLabel} onClick={onPreview} className="size-8 px-0 sm:w-auto sm:px-3">{previewIcon}<span className="hidden sm:inline">{previewLabel}</span></Button></Hint>}
        {exports.length > 0 && <DropdownMenu>
          <Hint label="Xuất"><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm" aria-label="Xuất" className="size-8 px-0 sm:w-auto sm:px-3"><Download className="size-4" /><span className="hidden sm:inline">Xuất</span><ChevronDown className="hidden size-3 sm:block" /></Button></DropdownMenuTrigger></Hint>
          <DropdownMenuContent align="end">{exports.map((item) => <DropdownMenuItem key={item.label} onSelect={item.onSelect}>{item.label}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>}
        {!readOnly && <Hint label={`Lưu · ${savedLabel}`}><Button type="button" size="sm" aria-label="Lưu" onClick={onSave} className="size-8 px-0 sm:w-auto sm:px-3"><Save className="size-4" /><span className="hidden sm:inline">Lưu</span><span className="sr-only">{savedLabel}</span></Button></Hint>}
      </div>
    </header>
  </TooltipProvider>
}
