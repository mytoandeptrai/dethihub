import type { ComponentProps } from 'react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { cn } from '@/engine/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export function TooltipContent({ className, sideOffset = 6, children, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return <TooltipPrimitive.Portal><TooltipPrimitive.Content data-slot="tooltip-content" sideOffset={sideOffset} className={cn('z-[220] max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-soft', className)} {...props}>
    {children}<TooltipPrimitive.Arrow className="fill-foreground" />
  </TooltipPrimitive.Content></TooltipPrimitive.Portal>
}
