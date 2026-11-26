'use client'
import { cn } from '@workspace/ui/lib/utils'
import { Popover as PopoverPrimitive } from 'radix-ui'

import type { ComponentProps } from 'react'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

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
        'border-line shadow-float z-[210] w-72 rounded-xl border bg-popover p-4 text-popover-foreground',
        className,
      )}
      {...props}
    />
  )
  return portalled ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content
}
