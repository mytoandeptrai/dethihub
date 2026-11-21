const DAY_MS = 24 * 60 * 60 * 1000
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

export const REVENUE_KEYS = [
  'day',
  'prevDay',
  'week',
  'prevWeek',
  'month',
  'prevMonth',
  'all',
] as const

export type RevenueKey = (typeof REVENUE_KEYS)[number]

export interface RevenueRange {
  key: RevenueKey
  from: Date
  /** Exclusive */
  to: Date
}

/** Start of a Vietnam-time (UTC+7) day, as a UTC timestamp */
const vnDayStart = (ms: number): number =>
  Math.floor((ms + VN_OFFSET_MS) / DAY_MS) * DAY_MS - VN_OFFSET_MS

/** First instant of the month containing `ms` (Vietnam time), or of the month `back` months before */
function vnMonthStart(ms: number, back = 0): number {
  const local = new Date(ms + VN_OFFSET_MS)
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - back, 1) - VN_OFFSET_MS
}

const range = (key: RevenueKey, from: number, to: number): RevenueRange => ({
  key,
  from: new Date(from),
  to: new Date(to),
})

/**
 * Each previous period runs the same elapsed time as the current one (yesterday up to the same hour,
 * last week up to the same weekday and hour, last month up to the same day and hour) so they compare fairly.
 */
export function revenueRanges(nowMs = Date.now()): RevenueRange[] {
  const end = nowMs + 1
  const dayStart = vnDayStart(nowMs)
  const mondayOffset = (new Date(dayStart + VN_OFFSET_MS).getUTCDay() + 6) % 7
  const weekStart = dayStart - mondayOffset * DAY_MS
  const monthStart = vnMonthStart(nowMs)
  const prevMonthStart = vnMonthStart(nowMs, 1)

  return [
    range('day', dayStart, end),
    range('prevDay', dayStart - DAY_MS, dayStart - DAY_MS + (end - dayStart)),
    range('week', weekStart, end),
    range('prevWeek', weekStart - 7 * DAY_MS, weekStart - 7 * DAY_MS + (end - weekStart)),
    range('month', monthStart, end),
    range('prevMonth', prevMonthStart, Math.min(monthStart, prevMonthStart + (end - monthStart))),
    range('all', 0, end),
  ]
}

/** Orders left unpaid past the payment link's lifetime (15 min) plus a margin need a look */
export const STALE_PENDING_MS = 20 * 60 * 1000
