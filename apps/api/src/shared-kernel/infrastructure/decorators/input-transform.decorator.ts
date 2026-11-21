import { Transform } from 'class-transformer'

/** Trims a string and silently cuts it to `max` characters */
export const Trim = (max: number) =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().slice(0, max) : value,
  )

/** Lenient integer: absent stays undefined, junk falls back to `fallback`, the rest is clamped to [min, max] */
export const LenientInt = (fallback: number, min: number, max: number) =>
  Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === '') return value
    const parsed = Math.trunc(Number(value)) || fallback
    return Math.min(max, Math.max(min, parsed))
  })
