import type { TransformFnParams } from 'class-transformer'

/** Trims and caps text, the way a browser form is forgiven rather than rejected */
export const trimmedTo =
  (max: number) =>
  ({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().slice(0, max) : value

export const csvToList = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : value
