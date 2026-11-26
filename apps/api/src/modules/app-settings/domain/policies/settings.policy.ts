export const SETTING_KEYS = [
  'maintenance',
  'announcements',
  'pricing',
  'ai_welcome',
  'features',
] as const

export const FEATURE_KEYS = ['word', 'slide', 'board', 'online'] as const
export type SiteFeatures = Record<(typeof FEATURE_KEYS)[number], boolean>

export function resolveFeatures(value?: Partial<SiteFeatures> | null): SiteFeatures {
  return {
    word: value?.word !== false,
    slide: value?.slide !== false,
    board: value?.board !== false,
    online: value?.online !== false,
  }
}

export type SettingKey = (typeof SETTING_KEYS)[number]

export class SettingsValidationError extends Error {}

type Raw = Record<string, unknown>

const MAX_ANNOUNCEMENTS = 12
const MAX_ACTIVE_ANNOUNCEMENTS = 5
const IMAGE_PATTERN = /^\/api\/files\/img\/[a-f0-9]{40}\.(png|jpg|webp|gif)$/
const TRY_PATH_PATTERN = /^\/(?![/\\])\S*$/

const fail = (message: string): never => {
  throw new SettingsValidationError(message)
}

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const wholeNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) ? value : Number.NaN

const records = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : [])

function instant(value: unknown): string | null {
  const until = text(value, 40)
  if (until && Number.isNaN(Date.parse(until))) fail('Thời điểm kết thúc không hợp lệ.')
  return until || null
}

function maintenance(value: Raw): Raw {
  return {
    on: value['on'] === true,
    message: text(value['message'], 500),
    until: instant(value['until']),
  }
}

function announcements(value: Raw): Raw {
  const raw = records(value['items'])
  if (raw.length > MAX_ANNOUNCEMENTS) fail(`Tối đa ${MAX_ANNOUNCEMENTS} thông báo.`)
  const items = raw.map((entry) => {
    const item = {
      id: text(entry?.['id'], 40),
      on: entry?.['on'] === true,
      title: text(entry?.['title'], 100),
      text: text(entry?.['text'], 500),
      image: text(entry?.['image'], 200),
      tryPath: text(entry?.['tryPath'], 200),
      until: instant(entry?.['until']),
    }
    if (!item.id) fail('Thông báo thiếu mã.')
    if (!item.title && !item.text && !item.image) {
      fail('Có thông báo còn trống, hãy nhập nội dung hoặc xoá đi.')
    }
    // Shown to everyone: images only from the app's own store, "try" links stay inside the app
    if (item.image && !IMAGE_PATTERN.test(item.image)) fail('Ảnh thông báo không hợp lệ.')
    if (item.tryPath && !TRY_PATH_PATTERN.test(item.tryPath)) {
      fail('Đường dẫn "Dùng thử" phải nằm trong app, ví dụ /soan-de.')
    }
    return item
  })
  if (items.filter((item) => item.on).length > MAX_ACTIVE_ANNOUNCEMENTS) {
    fail(`Chỉ bật tối đa ${MAX_ACTIVE_ANNOUNCEMENTS} thông báo cùng lúc.`)
  }
  return { items }
}

function aiWelcome(value: Raw): Raw {
  const points = wholeNumber(value['points'])
  if (!(points >= 0 && points <= 10_000)) fail('Điểm chào mừng phải là số nguyên từ 0 đến 10.000.')
  return { points }
}

function pricing(value: Raw): Raw {
  const pointsPer1000 = wholeNumber(value['pointsPer1000'])
  const minVnd = wholeNumber(value['minVnd'])
  const maxVnd = wholeNumber(value['maxVnd'])
  if (!(pointsPer1000 >= 1 && pointsPer1000 <= 1000)) {
    fail('Số điểm mỗi 1.000đ phải từ 1 đến 1.000.')
  }
  if (
    !(minVnd >= 1000 && maxVnd <= 10_000_000 && minVnd <= maxVnd) ||
    minVnd % 1000 ||
    maxVnd % 1000
  ) {
    fail('Mức nạp tối thiểu / tối đa phải là bội số 1.000đ, tối thiểu ≤ tối đa.')
  }
  const raw = records(value['packs'])
  if (raw.length === 0 || raw.length > 8) fail('Cần từ 1 đến 8 gói.')
  const packs = raw.map((pack) => {
    const vnd = wholeNumber(pack?.['vnd'])
    const rawBonus = pack?.['bonus']
    const bonus = typeof rawBonus === 'number' ? Math.round(rawBonus * 1000) / 1000 : Number.NaN
    if (!(vnd >= minVnd && vnd <= maxVnd) || vnd % 1000) {
      fail('Giá mỗi gói phải là bội số 1.000đ, nằm trong mức nạp tối thiểu – tối đa.')
    }
    if (!(bonus >= 0 && bonus <= 1)) fail('Thưởng lần đầu phải từ 0% đến 100%.')
    return { vnd, bonus }
  })
  if (new Set(packs.map((pack) => pack.vnd)).size !== packs.length) fail('Hai gói trùng giá.')
  packs.sort((a, b) => a.vnd - b.vnd)
  const requested = value['defaultVnd']
  const defaultVnd = packs.some((pack) => pack.vnd === requested)
    ? (requested as number)
    : (packs[0]?.vnd ?? minVnd)
  return { pointsPer1000, minVnd, maxVnd, packs, defaultVnd }
}

export function isSettingKey(key: string): key is SettingKey {
  return SETTING_KEYS.includes(key as SettingKey)
}

/** Returns the cleaned value to store; throws SettingsValidationError with a user-facing message */
export function sanitizeSetting(key: string, value: Raw): Raw {
  if (!isSettingKey(key)) return fail('Cài đặt không tồn tại.')
  if (key === 'features') {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some(
        (property) => !FEATURE_KEYS.includes(property as keyof SiteFeatures),
      ) ||
      FEATURE_KEYS.some((property) => typeof value[property] !== 'boolean')
    ) {
      return fail('Tính năng phải có đủ bốn giá trị boolean và không có thuộc tính khác.')
    }
    return Object.fromEntries(FEATURE_KEYS.map((property) => [property, value[property]]))
  }
  if (key === 'maintenance') return maintenance(value)
  if (key === 'announcements') return announcements(value)
  if (key === 'ai_welcome') return aiWelcome(value)
  return pricing(value)
}
