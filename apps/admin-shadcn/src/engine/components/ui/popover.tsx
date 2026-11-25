import { Popover as PopoverPrimitive } from 'radix-ui'
import { useState, type ComponentProps } from 'react'

import { EscapeLayer } from '@/engine/components/EscapeLayer'
import { cn } from '@/engine/lib/utils'

export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Root>) {
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const open = controlledOpen ?? localOpen
  const changeOpen = (next: boolean) => {
    if (controlledOpen === undefined) setLocalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <EscapeLayer enabled={open} onClose={() => changeOpen(false)}>
      <PopoverPrimitive.Root {...props} open={open} onOpenChange={changeOpen}>
        {children}
      </PopoverPrimitive.Root>
    </EscapeLayer>
  )
}
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export function PopoverContent({
  className,
  align = 'center',
  sideOffset = 8,
  portalled = true,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content> & { portalled?: boolean }) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'shadow-float z-[210] w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground',
        className,
      )}
      {...props}
    />
  )
  return portalled ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content
}
