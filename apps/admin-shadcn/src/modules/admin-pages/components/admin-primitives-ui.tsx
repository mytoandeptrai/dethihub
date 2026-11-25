'use client'
import { PortalContainerContext } from '@admin-overlays-engine'
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'
import { MoreHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'

import { SiteButton } from '@/components/product-ui'
import { t as translate } from '@/i18n/translate-admin-pages'

import type { ComponentProps, ReactNode } from 'react'
import './admin-overlays.css'
export function AdminTable({ className, ...props }: ComponentProps<'table'>) {
  return (
    <table
      className={cn(
        'text-body [&_thead]:bg-sunken [&_th]:border-line [&_th]:text-caption [&_tbody_tr:hover]:bg-sunken/60 w-full border-separate border-spacing-0 text-left [&_tbody_tr]:transition-colors [&_td]:px-4 [&_td]:py-3 [&_th]:border-b [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:tracking-normal [&_th]:normal-case [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10',
        className,
      )}
      {...props}
    />
  )
}
function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null)
  const initialized = useRef(false)
  if (!initialized.current) {
    initialized.current = true
    opener.current = (() => {
      if (typeof document === 'undefined') return null
      const focused = document.activeElement as HTMLElement | null
      const menu =
        focused?.closest('[role="menu"]') ?? document.querySelector('[role="menu"][data-open]')
      return (
        (menu &&
          document.querySelector<HTMLElement>(
            `[id="${CSS.escape(menu.getAttribute('aria-labelledby') ?? '')}"]`,
          )) ||
        focused
      )
    })()
  }
  return () => opener.current
}
function hasForegroundDialog() {
  return !!document.querySelector(
    '[data-slot="dialog-content"]:not([data-admin-modal], [data-admin-drawer])',
  )
}
export function AdminDrawer({
  children,
  className,
  onClose,
  ...props
}: ComponentProps<typeof DialogContent> & {
  onClose: () => void
}) {
  const opener = useReturnFocus()
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          if (hasForegroundDialog()) details.cancel()
          else onClose()
        }
      }}
    >
      <DialogContent
        {...props}
        data-admin-drawer=""
        aria-describedby={undefined}
        finalFocus={opener}
        showCloseButton={false}
        className={cn(
          'shadow-float [&>div:first-of-type]:bg-sunken/40 inset-y-0 right-0 left-auto h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-l border-border bg-background p-0 sm:max-w-none [&>div:first-of-type]:py-5',
          className,
          'z-[200]',
        )}
      >
        <DialogTitle className="sr-only">{props['aria-label']}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
export function AdminModal({
  children,
  title,
  onClose,
  className,
}: {
  children: ReactNode
  title: ReactNode
  onClose: () => void
  className?: string
}) {
  const opener = useReturnFocus()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          if (container?.querySelector('[data-portal-child]') || hasForegroundDialog())
            details.cancel()
          else onClose()
        }
      }}
    >
      <DialogContent
        ref={setContainer}
        data-admin-modal=""
        finalFocus={opener}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          'shadow-float z-[220] block max-h-[90dvh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 sm:p-7',
          className,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <PortalContainerContext.Provider value={container}>
          {children}
        </PortalContainerContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
export function AdminRowActions({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SiteButton
            variant="ghost"
            size="icon"
            aria-label={translate('adminPagesCopy.actions')}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
