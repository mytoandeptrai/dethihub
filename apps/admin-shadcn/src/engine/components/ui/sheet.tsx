import { X } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'

import { cn } from '@/engine/lib/utils'

import type { ComponentProps } from 'react'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close
export const SheetPortal = SheetPrimitive.Portal
export function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('bg-ink/40 fixed inset-0 z-[200] backdrop-blur-sm', className)}
      {...props}
    />
  )
}
export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'shadow-float fixed z-[200] flex flex-col gap-4 overflow-y-auto bg-background p-6 text-foreground',
          {
            'inset-y-0 right-0 h-full w-3/4 border-l border-border sm:max-w-sm': side === 'right',
            'inset-y-0 left-0 h-full w-3/4 border-r border-border sm:max-w-sm': side === 'left',
            'inset-x-0 top-0 max-h-[90dvh] border-b border-border': side === 'top',
            'inset-x-0 bottom-0 max-h-[90dvh] border-t border-border': side === 'bottom',
          },
          className,
        )}
        {...props}
      >
        {children}
        <SheetClose
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </SheetClose>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}
export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="sheet-header" className={cn('flex flex-col gap-2', className)} {...props} />
  )
}
export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2', className)}
      {...props}
    />
  )
}
export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}
export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
