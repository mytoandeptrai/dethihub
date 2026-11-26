'use client'
import { cn } from '@workspace/ui/lib/utils'

import type { SwitchParts as Imported0 } from '@/modules/admin-pages/containers/switch-container/switch-container'
import type { SwitchModel } from '@/modules/admin-pages/hooks'
export function SwitchSwitchUi(
  props: ReturnType<typeof SwitchModel.useSwitchContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const { id, checked, disabled, onChange, label } = props
    return (
      <div className="inline-flex items-center gap-2.5 select-none">
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            'focus-visible:ring-clay/40 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2',
            disabled && 'cursor-not-allowed opacity-40',
            checked ? 'bg-clay' : 'bg-line-2 hover:bg-ink-4',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
        {label ? (
          <label
            htmlFor={id}
            className={cn(
              'text-ink cursor-pointer text-[13.5px] font-medium whitespace-nowrap',
              disabled && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => !disabled && onChange(!checked)}
          >
            {label}
          </label>
        ) : null}
      </div>
    )
  }
  return null
}
