'use client'
import { useSlidingThumb } from '@product-ui-engine'
import { cn } from '@workspace/ui/lib/utils'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { useRef } from 'react'

import type { ReactNode } from 'react'
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: {
    key: T
    label: string
    count?: number
    icon?: ReactNode
  }[]
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-checked="true"]', value)
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type="single"
      value={`value:${value}`}
      onValueChange={(next) => {
        const option = options.find((item) => `value:${item.key}` === next)
        if (option) onChange(option.key)
      }}
      role="radiogroup"
      aria-label={label}
      className={cn(
        'relative inline-flex h-11 max-w-full items-center gap-0 overflow-x-auto rounded-[8px] bg-sunken p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {thumb ? (
        <span
          aria-hidden
          className="absolute inset-y-[3px] left-0 rounded-[6px] bg-surface shadow-soft transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      ) : null}
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.key}
          value={`value:${option.key}`}
          type="button"
          role="radio"
          aria-checked={value === option.key}
          onClick={() => {
            if (value === option.key) onChange(option.key)
          }}
          className={cn(
            'relative z-10 flex h-full shrink-0 items-center gap-2 whitespace-nowrap rounded-[6px] px-3 text-[13.5px] font-semibold transition-colors duration-200 active:scale-[0.97] data-[state=on]:bg-transparent data-[state=on]:shadow-none sm:px-4',
            value === option.key ? 'text-ink' : 'text-ink-3 hover:text-ink',
          )}
        >
          {option.icon}
          {option.label}
          {option.count === undefined ? null : (
            <span className="tnum text-[12px] font-medium text-ink-4">{option.count}</span>
          )}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
