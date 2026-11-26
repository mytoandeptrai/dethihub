'use client'
import { cn } from '@workspace/ui/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/product-ui/popover-ui'
import { inputClass } from '@/components/product-ui/primitives-ui'
import { t } from '@/i18n/translate-workspace'

import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

export interface SiteSelectOption<K extends string> {
  value: K
  label: string
}
const fold = (text: string) =>
  text.toLowerCase().normalize('NFD').replaceAll(/\p{M}/gu, '').replaceAll('đ', 'd')
export function SiteSelect<K extends string>({
  value,
  options,
  onChange,
  label,
  className,
  inline = false,
  searchable = false,
  up = false,
  triggerClassName,
}: {
  value: K
  options: readonly SiteSelectOption<K>[]
  onChange: (value: K) => void
  label: string
  className?: string
  inline?: boolean
  searchable?: boolean
  up?: boolean
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)
  const needle = fold(query.trim())
  const visible =
    searchable && needle ? options.filter((o) => fold(o.label).includes(needle)) : options
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (inline) root?.scrollIntoView({ block: 'nearest' })
    searchRef.current?.focus({ preventScroll: true })
  }, [inline, open, searchable])
  const pick = (option: SiteSelectOption<K>) => {
    onChange(option.value)
    setOpen(false)
    if (inline || searchable) triggerRef.current?.focus({ preventScroll: true })
  }
  const moveFocus = (e: ReactKeyboardEvent) => {
    const buttons = [...(listRef.current?.querySelectorAll('button') ?? [])]
    if (buttons.length === 0) return
    const index = buttons.indexOf(e.target as HTMLButtonElement)
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? buttons.length - 1
          : e.key === 'ArrowDown'
            ? Math.min(index + 1, buttons.length - 1)
            : e.key === 'ArrowUp'
              ? index < 0
                ? buttons.length - 1
                : Math.max(index - 1, 0)
              : -1
    if (next < 0) return
    e.preventDefault()
    buttons[next]?.focus()
  }
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setQuery('')
        setOpen(next)
      }}
    >
      <div
        ref={rootRef}
        className={cn(
          'relative',
          inline &&
            '[&>[data-radix-popper-content-wrapper]]:static! [&>[data-radix-popper-content-wrapper]]:min-w-0! [&>[data-radix-popper-content-wrapper]]:transform-none!',
          className,
        )}
        onBlur={
          inline || searchable
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
              }
            : undefined
        }
      >
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={label}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
              if (open) return moveFocus(e)
              e.preventDefault()
              setQuery('')
              setOpen(true)
              const last = e.key === 'ArrowUp'
              requestAnimationFrame(() => {
                const buttons = listRef.current?.querySelectorAll('button')
                if (buttons?.length) buttons[last ? buttons.length - 1 : 0]?.focus()
              })
            }}
            className={
              triggerClassName ??
              cn(
                'border-line-2 text-ink hover:border-clay-line focus-visible:border-clay flex w-full items-center justify-between rounded-lg border bg-white font-semibold transition-[colors,box-shadow] duration-150 focus-visible:shadow-ring focus-visible:outline-none',
                inline ? 'h-8 gap-2 px-2 text-[13px]' : 'h-11 gap-3 px-4 text-[14.5px]',
              )
            }
          >
            <span className="truncate">{selected?.label}</span>
            <ChevronDown
              className={cn(
                'shrink-0 transition-transform duration-200',
                triggerClassName ? 'size-3.5' : 'text-ink-3 size-4',
                open && 'rotate-180',
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          portalled={false}
          side={up ? 'top' : 'bottom'}
          align="start"
          sideOffset={inline ? 0 : 8}
          role="presentation"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            searchRef.current?.focus({ preventScroll: true })
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
            triggerRef.current?.focus({ preventScroll: true })
          }}
          className={cn(
            'border-line shadow-float w-max min-w-[var(--radix-popover-trigger-width)] rounded-xl border bg-white p-1.5',
            inline ? 'mt-1 w-full' : up ? 'min-w-[9.5rem]' : '',
          )}
        >
          {searchable && (
            <input
              ref={searchRef}
              type="search"
              aria-label={t('workspaceCopy.m497', { value0: label.toLowerCase() })}
              placeholder={t('workspaceCopy.m498')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || visible.length === 0) return
                if (e.key === 'ArrowDown') moveFocus(e)
                if (e.key === 'Enter' && needle) {
                  e.preventDefault()
                  if (visible[0]) pick(visible[0])
                }
              }}
              className={cn(inputClass, 'mb-1 h-8 px-2 py-1 text-[13px]')}
            />
          )}
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            onKeyDown={moveFocus}
            className={cn(
              'overflow-y-auto',
              inline ? 'max-h-[min(14rem,35dvh)] overscroll-contain' : 'max-h-[308px]',
            )}
          >
            {visible.map((o) => {
              const active = o.value === value
              return (
                <li key={o.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    className={cn(
                      'focus-visible:ring-clay/30 active:bg-clay-soft flex w-full items-center justify-between rounded-lg text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                      inline
                        ? 'min-h-8 gap-2 px-2 py-1 text-[13px] break-words'
                        : up
                          ? 'min-h-8 gap-4 px-2.5 py-1.5 text-[13px] whitespace-nowrap'
                          : 'gap-6 px-3.5 py-2.5 text-[14.5px] whitespace-nowrap',
                      active
                        ? 'bg-clay-tint text-clay hover:bg-clay-soft font-semibold'
                        : 'text-ink-2 hover:bg-sunken hover:text-ink',
                    )}
                  >
                    <span className="min-w-0">{o.label}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          {visible.length === 0 && (
            <p role="status" className="text-ink-3 px-2 py-1 text-[13px]">
              {t('workspaceCopy.m499')}
            </p>
          )}
        </PopoverContent>
      </div>
    </Popover>
  )
}
