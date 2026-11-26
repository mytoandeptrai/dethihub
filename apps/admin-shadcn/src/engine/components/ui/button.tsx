import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/engine/lib/utils'

import type { ComponentProps } from 'react'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'hover:bg-clay-deep active:bg-clay-deep bg-primary text-primary-foreground shadow-accent',
        destructive:
          'text-destructive-foreground bg-destructive hover:bg-destructive/90 active:bg-destructive/80',
        outline:
          'hover:border-line-2 active:bg-line border border-input bg-background text-foreground hover:bg-muted',
        secondary:
          'hover:bg-veil active:bg-line border border-border bg-secondary text-secondary-foreground',
        ghost:
          'text-ink-2 active:bg-line border border-transparent hover:border-border hover:bg-muted hover:text-foreground',
        link: 'active:text-clay-deep text-primary underline-offset-4 hover:underline',
        quiet:
          'active:bg-line border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
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

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
