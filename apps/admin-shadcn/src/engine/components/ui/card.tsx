import type { ComponentProps } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/engine/lib/utils'

export function Card({ className, asChild = false, ...props }: ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp data-slot="card" className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-soft', className)} {...props} />
}
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}
export function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
}
export function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
export function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('self-start justify-self-end', className)} {...props} />
}
