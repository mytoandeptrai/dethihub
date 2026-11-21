export interface PricingPack {
  vnd: number
  bonus: number
}

export interface PricingConfig {
  pointsPer1000: number
  minVnd: number
  maxVnd: number
  packs: PricingPack[]
  defaultVnd: number
}

export const DEFAULT_PRICING: PricingConfig = {
  pointsPer1000: 25,
  minVnd: 2000,
  maxVnd: 100_000,
  packs: [
    { vnd: 2000, bonus: 0 },
    { vnd: 5000, bonus: 0.05 },
    { vnd: 10_000, bonus: 0.1 },
    { vnd: 20_000, bonus: 0.15 },
    { vnd: 50_000, bonus: 0.2 },
  ],
  defaultVnd: 10_000,
}

export interface UsageItem {
  id: string
  label: string
  min: number
  points: number
}

export const USAGE: readonly UsageItem[] = [
  { id: 'exam', label: 'Soạn 1 đề (vd. Toán THPT, 22 câu)', min: 20, points: 27 },
  { id: 'slide', label: 'Soạn 1 bộ slide 15 trang', min: 26, points: 35 },
  { id: 'ask', label: '1 lượt AI hỏi lại trước khi soạn', min: 10, points: 10 },
  { id: 'edit', label: '1 lượt sửa / hỏi thêm', min: 5, points: 5 },
  { id: 'search', label: '1 lượt tìm trên web', min: 5, points: 5 },
  { id: 'image', label: '1 ảnh minh hoạ AI', min: 5, points: 5 },
]

const isPositive = (n: number) => Number.isFinite(n) && n > 0

export function basePoints(config: PricingConfig, vnd: number): number {
  if (!isPositive(vnd)) return 0
  return Math.floor((vnd / 1000) * config.pointsPer1000 + 1e-9)
}

export function packPoints(config: PricingConfig, pack: PricingPack, firstTime: boolean): number {
  const base = basePoints(config, pack.vnd)
  if (!firstTime || pack.bonus <= 0) return base
  return Math.floor(base * (1 + pack.bonus) + 1e-9)
}

export function clampVnd(config: PricingConfig, vnd: number): number {
  if (!isPositive(vnd)) return config.minVnd
  const rounded = Math.ceil(vnd / 1000) * 1000
  return Math.min(config.maxVnd, Math.max(config.minVnd, rounded))
}

export function vndFor(config: PricingConfig, points: number): number {
  if (!isPositive(points)) return config.minVnd
  let vnd = Math.ceil(points / config.pointsPer1000) * 1000
  if (basePoints(config, vnd) < points) vnd += 1000
  return Math.min(config.maxVnd, Math.max(config.minVnd, vnd))
}

export function usesFor(points: number): (UsageItem & { count: number })[] {
  const safe = isPositive(points) ? points : 0
  return USAGE.map((item) => ({
    id: item.id,
    label: item.label,
    min: item.min,
    points: item.points,
    count: Math.floor(safe / item.points),
  }))
}

export function sortedPacks(config: PricingConfig): PricingPack[] {
  return config.packs.toSorted((a, b) => a.vnd - b.vnd)
}
