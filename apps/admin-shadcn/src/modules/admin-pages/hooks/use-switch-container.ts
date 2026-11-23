'use client'
export function useSwitchContainer({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}) {
  return { viewState: 0 as const, id, checked, disabled, onChange, label }
}
