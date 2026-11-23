'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Button as PrimitiveButton } from '@workspace/ui/components/button'
import { Card as PrimitiveCard } from '@workspace/ui/components/card'
import { cn } from '@workspace/ui/lib/utils'
import NextLink from 'next/link'
import { Slot, Tabs as TabsPrimitive } from 'radix-ui'
import { isValidElement } from 'react'

import { appPaths } from '@/config/app-paths'

import type { ComponentProps, ReactElement, ReactNode } from 'react'

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to?: string; href?: string }
export function Link({ to, href, ...props }: LinkProps) {
  return <NextLink href={href ?? to ?? appPaths.home.href} {...props} />
}

type NavLinkProps = Omit<LinkProps, 'className' | 'children'> & {
  pathname: string
  end?: boolean
  className?: string | ((state: { isActive: boolean }) => string)
  children: ReactNode | ((state: { isActive: boolean }) => ReactNode)
}
export function NavLink({
  pathname,
  to = appPaths.home.href,
  end,
  className,
  children,
  ...props
}: NavLinkProps) {
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(to + '/')
  return (
    <Link
      {...props}
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className({ isActive }) : className}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  )
}

type ButtonProps = Omit<ComponentProps<typeof PrimitiveButton>, 'variant' | 'size'> & {
  asChild?: boolean
  variant?: 'default' | 'primary' | 'clay' | 'outline' | 'ghost' | 'secondary' | 'destructive'
  size?: 'default' | 'md' | 'sm' | 'lg' | 'icon'
}
export function Button({
  asChild,
  children,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ButtonProps) {
  const resolved = variant === 'primary' || variant === 'clay' ? 'default' : variant
  const classes = cn(
    'gap-2 rounded-lg font-semibold',
    (size === 'default' || size === 'md') && 'h-10 px-4 py-2',
    size === 'lg' && 'h-12 gap-2.5 px-6 text-[15px]',
    size === 'sm' && 'h-9 gap-1.5 px-3.5 text-[13px]',
    size === 'icon' && 'size-10',
    resolved === 'default' && 'bg-clay hover:bg-clay-deep text-white shadow-accent',
    className,
  )
  if (asChild && isValidElement(children))
    return (
      <PrimitiveButton
        {...props}
        variant={resolved}
        size={size === 'md' ? 'default' : size}
        className={classes}
        render={children as ReactElement}
      />
    )
  return (
    <PrimitiveButton
      {...props}
      variant={resolved}
      size={size === 'md' ? 'default' : size}
      className={classes}
    >
      {children}
    </PrimitiveButton>
  )
}

type CardProps = ComponentProps<typeof PrimitiveCard> & { asChild?: boolean }
export function Card({ asChild, className, children, ...props }: CardProps) {
  const Comp = asChild ? Slot.Root : PrimitiveCard
  return (
    <Comp
      {...props}
      className={cn(
        'border-line shadow-soft block gap-0 rounded-xl border bg-card p-0 text-card-foreground',
        className,
        asChild && isValidElement<{ className?: string }>(children) && children.props.className,
      )}
    >
      {children}
    </Comp>
  )
}

type AvatarUiProps = {
  src?: string | null
  name: string
  className?: string
  fallbackClassName?: string
}
export function AvatarUi({ src, name, className, fallbackClassName }: AvatarUiProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={src ?? undefined} alt={name} />
      <AvatarFallback className={cn('bg-clay text-white', fallbackClassName)}>
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

type SegmentedProps<T extends string> = {
  value: T
  options: { key: T; label: string }[]
  onChange: (value: T) => void
  className?: string
  label: string
}
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: SegmentedProps<T>) {
  return (
    <div
      aria-label={label}
      className={cn('border-line bg-sunken inline-flex gap-1 rounded-lg border p-1', className)}
    >
      {options.map((option) => (
        <Button
          key={option.key}
          variant="ghost"
          size="sm"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={value === option.key ? 'bg-white shadow-sm' : ''}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-150 hover:border-ink-4 focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive'
export const Tabs = TabsPrimitive.Root
export const TabsList = TabsPrimitive.List
export const TabsTrigger = TabsPrimitive.Trigger
export const TabsContent = TabsPrimitive.Content
