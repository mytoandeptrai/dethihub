import { cn } from '@/engine/lib/utils'

import type { ComponentProps } from 'react'

export const inputStyles =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-150 hover:border-ink-4 focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" type={type} className={cn(inputStyles, className)} {...props} />
}
