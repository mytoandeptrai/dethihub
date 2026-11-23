import type { ComponentProps } from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/engine/lib/utils'

export const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] leading-4 font-semibold transition-colors', {
  variants: { variant: {
    default: 'border-clay-line bg-clay-tint text-primary',
    secondary: 'border-border bg-secondary text-secondary-foreground',
    destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
    outline: 'border-border bg-background text-muted-foreground',
  } },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, asChild = false, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
