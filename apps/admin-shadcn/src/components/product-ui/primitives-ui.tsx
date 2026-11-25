'use client'
import { Badge as PrimitiveBadge } from '@workspace/ui/components/badge'
import { Card as PrimitiveCard } from '@workspace/ui/components/card'
import { Checkbox as PrimitiveCheckbox } from '@workspace/ui/components/checkbox'
import * as Menu from '@workspace/ui/components/dropdown-menu'
import { Label } from '@workspace/ui/components/label'
import * as Selects from '@workspace/ui/components/select'
import { Skeleton } from '@workspace/ui/components/skeleton'
import * as Tips from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { Slot, Tabs as TabsPrimitive } from 'radix-ui'
import { isValidElement } from 'react'

import { LoadingRegion } from '@/components/page-skeleton'
import { PageShell as PublicPageShell } from '@/modules/public-pages/components/page-header-ui'
import { AvatarUi, Button } from '@/modules/public-pages/components/public-primitives-ui'

import type { ComponentProps, ReactElement, ReactNode } from 'react'

export { PageHeader } from '@/modules/public-pages/components/page-header-ui'
export { inputClass } from '@/modules/public-pages/components/public-primitives-ui'
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@workspace/ui/components/dropdown-menu'
export {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
export { Tooltip, TooltipContent } from '@workspace/ui/components/tooltip'
export { AvatarUi, Button, Skeleton }

export function Badge({
  variant = 'default',
  className,
  ...props
}: ComponentProps<typeof PrimitiveBadge>) {
  return (
    <PrimitiveBadge
      {...props}
      variant={variant}
      className={cn(
        'h-auto rounded-full px-2.5 py-1 text-[11.5px] leading-4 font-semibold transition-colors',
        variant === 'secondary' && 'border-line',
        variant === 'outline' && 'border-line text-ink-3 bg-white',
        className,
      )}
    />
  )
}

export function PageShell({ className, ...props }: ComponentProps<typeof PublicPageShell>) {
  return <PublicPageShell {...props} className={cn('py-6 lg:py-6', className)} />
}

export function Card({
  asChild,
  className,
  ...props
}: ComponentProps<typeof PrimitiveCard> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : PrimitiveCard
  return (
    <Comp
      {...props}
      data-slot="card"
      className={cn(
        'border-line shadow-soft block flex-row gap-0 overflow-visible rounded-xl border bg-card p-0 text-card-foreground ring-0',
        className,
      )}
    />
  )
}

export const Tabs = TabsPrimitive.Root
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      {...props}
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className,
      )}
    />
  )
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      {...props}
      data-slot="tabs-trigger"
      className={cn(
        'data-[state=active]:shadow-soft inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground',
        className,
      )}
    />
  )
}
export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content {...props} data-slot="tabs-content" className={cn('mt-2', className)} />
  )
}

type ButtonProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  variant?: ComponentProps<typeof Button>['variant'] | 'soft' | 'quiet'
}
export function SiteButton({ variant = 'soft', size = 'md', className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      size={size}
      variant={variant === 'soft' ? 'secondary' : variant === 'quiet' ? 'ghost' : variant}
      className={cn(
        'select-none active:scale-[0.97]',
        size === 'md' && 'h-10.5 px-4.5 text-[14px]',
        size === 'lg' && 'h-12.5',
        className,
      )}
    />
  )
}

export function SiteBadge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'clay' | 'sage' | 'honey' | 'outline'
  className?: string
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-line bg-sunken text-ink-2',
    clay: 'border-clay-line bg-clay-tint text-clay',
    sage: 'border-sage/15 bg-sage-soft text-sage',
    honey: 'border-honey/15 bg-honey-soft text-honey',
    outline: 'border-line bg-white text-ink-3',
  }
  return <Badge className={cn(tones[tone], className)}>{children}</Badge>
}

export function Avatar({
  name,
  ...props
}: Omit<ComponentProps<typeof AvatarUi>, 'name'> & { name?: string | null }) {
  return <AvatarUi {...props} name={name?.trim() || '?'} />
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Label className={cn('block leading-normal font-normal', className)}>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
      {hint && <span className="text-ink-3 mt-1.5 block text-[12px]">{hint}</span>}
    </Label>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  ...props
}: Omit<ComponentProps<typeof PrimitiveCheckbox>, 'onChange' | 'onCheckedChange'> & {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
}) {
  return (
    <label className="flex items-center gap-2">
      <PrimitiveCheckbox {...props} checked={checked} onCheckedChange={onChange} />
      {children}
    </label>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        'border-line-2 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-8 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div className="bg-surface text-ink-3 shadow-soft mb-4 flex size-14 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <p className="font-display text-ink text-[21px] font-semibold tracking-[-0.01em]">{title}</p>
      {description && (
        <p className="text-ink-3 mt-2 max-w-[44ch] text-[13.5px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  )
}

export function SkeletonCard({ variant = 'doc' }: { variant?: 'doc' | 'exam' }) {
  return (
    <LoadingRegion>
      <Card className="border-line/80 shadow-soft relative flex flex-col overflow-hidden rounded-xl border bg-white p-5">
        {variant === 'exam' ? (
          <Skeleton className="-mx-5 -mt-5 mb-5 h-[120px] rounded-none" />
        ) : (
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        )}
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-4 w-3/5" />
        <Skeleton className="mt-3 h-3 w-2/5" />
        <Skeleton className="mt-auto h-9 w-full" />
      </Card>
    </LoadingRegion>
  )
}

export function Toolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'border-line bg-surface mb-6 flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-3 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function FilterChips({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-ink-3 flex min-w-0 flex-wrap items-center gap-2 text-xs', className)}
      {...props}
    />
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: ComponentProps<typeof Menu.DropdownMenuTrigger> & { asChild?: boolean }) {
  return (
    <Menu.DropdownMenuTrigger
      {...props}
      render={asChild && isValidElement(children) ? (children as ReactElement) : undefined}
    >
      {asChild ? undefined : children}
    </Menu.DropdownMenuTrigger>
  )
}

export function DropdownMenuItem({
  onSelect,
  ...props
}: Omit<ComponentProps<typeof Menu.DropdownMenuItem>, 'onSelect'> & { onSelect?: () => void }) {
  return <Menu.DropdownMenuItem {...props} onClick={onSelect ?? props.onClick} />
}

export function DropdownMenuRadioItem(props: ComponentProps<typeof Menu.DropdownMenuRadioItem>) {
  return <Menu.DropdownMenuRadioItem closeOnClick {...props} />
}

export function DropdownMenuRadioGroup({
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof Menu.DropdownMenuRadioGroup>, 'onValueChange'> & {
  onValueChange?: (value: string) => void
}) {
  return (
    <Menu.DropdownMenuRadioGroup
      {...props}
      onValueChange={(value) => onValueChange?.(String(value))}
    />
  )
}

export function TooltipTrigger({
  asChild,
  children,
  ...props
}: ComponentProps<typeof Tips.TooltipTrigger> & { asChild?: boolean }) {
  return (
    <Tips.TooltipTrigger
      {...props}
      render={asChild && isValidElement(children) ? (children as ReactElement) : undefined}
    >
      {asChild ? undefined : children}
    </Tips.TooltipTrigger>
  )
}

export function TooltipProvider({
  delayDuration,
  ...props
}: ComponentProps<typeof Tips.TooltipProvider> & { delayDuration?: number }) {
  return <Tips.TooltipProvider {...props} delay={delayDuration ?? props.delay} />
}

export function Select({
  value,
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof Selects.Select>, 'value' | 'onValueChange'> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Selects.Select
      {...props}
      value={value}
      onValueChange={(nextValue) => onValueChange(String(nextValue ?? ''))}
    />
  )
}
