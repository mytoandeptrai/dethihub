import { createContext, useContext, type ComponentProps } from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/engine/lib/utils'

export const toggleVariants = cva('inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-soft disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: { default: 'bg-transparent', outline: 'border border-input bg-transparent' },
    size: { default: 'h-10 px-3', sm: 'h-9 px-2.5', lg: 'h-11 px-5' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
type StyleProps = VariantProps<typeof toggleVariants>
const ToggleGroupContext = createContext<StyleProps>({})

export function ToggleGroup({ className, variant, size, children, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root> & StyleProps) {
  return <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
}
export function ToggleGroupItem({ className, variant, size, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item> & StyleProps) {
  const context = useContext(ToggleGroupContext)
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" className={cn(toggleVariants({ variant: variant ?? context.variant, size: size ?? context.size }), className)} {...props} />
}
