import type { ComponentProps } from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { cn } from '@/engine/lib/utils'
import { buttonVariants } from './button'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogPortal = AlertDialogPrimitive.Portal
export function AlertDialogOverlay({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn('fixed inset-0 z-[200] bg-ink/40 backdrop-blur-sm', className)} {...props} />
}
export function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return <AlertDialogPortal><AlertDialogOverlay /><AlertDialogPrimitive.Content data-slot="alert-dialog-content" className={cn('fixed left-1/2 top-1/2 z-[200] grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground shadow-float sm:p-7', className)} {...props} /></AlertDialogPortal>
}
export function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-header" className={cn('flex flex-col gap-2 text-left', className)} {...props} />
}
export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}
export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn('font-display text-xl font-semibold leading-snug tracking-tight', className)} {...props} />
}
export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
}
export function AlertDialogAction({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(buttonVariants(), className)} {...props} />
}
export function AlertDialogCancel({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />
}
