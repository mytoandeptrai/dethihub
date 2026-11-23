import type { ComponentProps } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/engine/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn('fixed inset-0 z-[200] bg-ink/40 backdrop-blur-sm', className)} {...props} />
}
export function DialogContent({ className, children, showCloseButton = true, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return <DialogPortal><DialogOverlay /><DialogPrimitive.Content data-slot="dialog-content" className={cn('fixed left-1/2 top-1/2 z-[200] grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground shadow-float sm:p-7', className)} {...props}>
    {children}
    {showCloseButton && <DialogClose className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Đóng"><X className="size-4" /></DialogClose>}
  </DialogPrimitive.Content></DialogPortal>
}
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-2 text-left', className)} {...props} />
}
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}
export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('font-display text-xl font-semibold leading-snug tracking-tight', className)} {...props} />
}
export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
}
