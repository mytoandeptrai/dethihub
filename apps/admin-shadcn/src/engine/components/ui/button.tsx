import type { ComponentProps } from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/engine/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-accent hover:bg-clay-deep active:bg-clay-deep',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        outline: 'border border-input bg-background text-foreground hover:border-line-2 hover:bg-muted active:bg-line',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-veil active:bg-line',
        ghost: 'border border-transparent text-ink-2 hover:border-border hover:bg-muted hover:text-foreground active:bg-line',
        link: 'text-primary underline-offset-4 hover:underline active:text-clay-deep',
        quiet: 'border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground active:bg-line',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
        lg: 'h-12 gap-2.5 px-6 text-[15px]',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, asChild = false, ...props }: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
