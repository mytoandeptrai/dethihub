import { Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '@/engine/lib/utils'

import { Badge as BaseBadge } from './badge'
import { Button as BaseButton } from './button'
import { Card as BaseCard } from './card'
import { Checkbox as BaseCheckbox } from './checkbox'
import { Input, inputStyles } from './input'
import { Label } from './label'
import { Separator } from './separator'
import { Skeleton } from './skeleton'

type Variant = 'primary' | 'soft' | 'ghost' | 'outline' | 'clay' | 'quiet'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const VARIANTS = {
  primary: 'default',
  clay: 'default',
  soft: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  quiet: 'quiet',
} as const

const BASE_SIZES = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
  icon: 'icon',
} as const

const SIZES: Record<Size, string> = {
  sm: '',
  md: 'h-10.5 px-4.5 text-[14px]',
  lg: 'h-12.5',
  icon: '',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'soft', size = 'md', className, ...props },
  ref,
) {
  return (
    <BaseButton
      ref={ref}
      variant={VARIANTS[variant]}
      size={BASE_SIZES[size]}
      className={cn('select-none active:scale-[0.97]', SIZES[size], className)}
      {...props}
    />
  )
})

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'clay' | 'sage' | 'honey' | 'outline'
  className?: string
}) {
  const tones = {
    neutral: 'border-line bg-sunken text-ink-2',
    clay: 'border-clay-line bg-clay-tint text-clay',
    sage: 'border-sage/15 bg-sage-soft text-sage',
    honey: 'border-honey/15 bg-honey-soft text-honey',
    outline: 'border-line bg-white text-ink-3',
  }
  return <BaseBadge className={cn(tones[tone], className)}>{children}</BaseBadge>
}

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}) {
  return (
    <BaseCard asChild className={cn('border-line/80', className)}>
      <As>{children}</As>
    </BaseCard>
  )
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
      {hint ? <span className="text-ink-3 mt-1.5 block text-[12px]">{hint}</span> : null}
    </Label>
  )
}

/**
 * Thẻ chờ khi danh sách đang tải: cùng khung với thẻ thật để trang không nhảy khi dữ liệu về.
 * `exam` có dải đầu như thẻ đề cộng đồng, `doc` như thẻ tài liệu.
 */
export function SkeletonCard({ variant = 'doc' }: { variant?: 'doc' | 'exam' }) {
  return (
    <BaseCard
      aria-hidden="true"
      className="border-line/80 shadow-soft relative flex flex-col overflow-hidden rounded-xl border bg-white p-5"
    >
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
      <span
        className="anim-shimmer motion-reduce:animation-none pointer-events-none absolute inset-y-0 left-0 w-1/3"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
        }}
      />
    </BaseCard>
  )
}

/**
 * Nhận chữ làm `children`, hoặc dùng một mình với `aria-label`.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  'checked': boolean
  'onChange': (checked: boolean) => void
  'children'?: ReactNode
  'disabled'?: boolean
  'className'?: string
  'aria-label'?: string
}) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 select-none',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <BaseCheckbox
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {children}
    </label>
  )
}

export const inputClass = inputStyles

/** ô mật khẩu có nút con mắt: mắt nhắm khi đang ẩn, mắt mở khi đang hiện */
export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className={cn(className, '!pr-10')} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={show}
        data-tip={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="text-ink-3 hover:text-ink absolute inset-y-0 right-0 grid w-10 place-items-center"
      >
        {show ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
      </button>
    </div>
  )
}

export const selectClass =
  inputClass +
  " cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_1rem_center] bg-no-repeat pr-10"

/** same look, but sizes to its own content — for filter toolbars */
export const selectAutoClass = selectClass.replace('w-full ', 'w-auto min-w-[9rem] ')

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-line bg-sunken text-ink-3 shadow-soft rounded-md border px-1.5 py-0.5 font-mono text-[11px]">
      {children}
    </kbd>
  )
}

export function Divider({ className }: { className?: string }) {
  return <Separator className={className} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
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
    <BaseCard
      className={cn(
        'border-line-2 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-8 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="bg-surface text-ink-3 shadow-soft mb-4 flex size-14 items-center justify-center rounded-full">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-ink text-[21px] font-semibold tracking-[-0.01em]">{title}</p>
      {description ? (
        <p className="text-ink-3 mt-2 max-w-[44ch] text-[13.5px] leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </BaseCard>
  )
}
