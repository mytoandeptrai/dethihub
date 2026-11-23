import type { ComponentProps } from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/engine/lib/utils'

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn('peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator"><Check className="size-3.5" /></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
}
