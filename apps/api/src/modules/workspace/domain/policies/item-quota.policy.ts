import { ItemKind } from '@/modules/workspace/domain/enums/item-kind.enum'

const MB = 1024 * 1024

export interface ItemQuotaSnapshot {
  kind: ItemKind
  newBytes: number
  /** Size of the stored row being replaced; null when the item is new */
  oldBytes: number | null
  /** Items of this kind the owner already has */
  kindCount: number
  /** Everything the owner stores: synced items plus uploaded documents */
  used: number
  max: number
}

const itemMaxBytes = (kind: ItemKind): number => (kind === ItemKind.DOC ? MB : 2 * MB)

const COUNT_LIMITS: Partial<Record<ItemKind, number>> = {
  [ItemKind.DOC]: 100,
  [ItemKind.DECK]: 50,
  [ItemKind.BOARD]: 30,
}

const SIZE_LABEL: Partial<Record<ItemKind, string>> = {
  [ItemKind.DOC]: 'đề',
  [ItemKind.DECK]: 'slide',
  [ItemKind.BOARD]: 'bảng vẽ',
}

const COUNT_LABEL: Partial<Record<ItemKind, string>> = {
  [ItemKind.DOC]: 'đề thi',
  [ItemKind.DECK]: 'slide',
}

/** Returns the message to show the user, or null when the write is allowed */
export function checkItemQuota(snapshot: ItemQuotaSnapshot): string | null {
  const { kind, newBytes, oldBytes, kindCount, used, max } = snapshot

  // Shrinking or keeping the size is always allowed, even for an account already over its cap
  if (oldBytes !== null && newBytes <= oldBytes) return null

  const itemMax = itemMaxBytes(kind)
  if (newBytes > itemMax) {
    return `Tệp quá lớn để đồng bộ (tối đa ${itemMax / MB} MB mỗi ${SIZE_LABEL[kind] ?? 'mục'}).`
  }

  const countLimit = COUNT_LIMITS[kind]
  if (oldBytes === null && countLimit !== undefined && kindCount >= countLimit) {
    return `Đã đủ ${countLimit} ${COUNT_LABEL[kind] ?? 'bảng vẽ'}, xoá bớt để lưu thêm.`
  }

  if (used - (oldBytes ?? 0) + newBytes > max) {
    return `Đã dùng hết ${(max / MB).toFixed(1)} MB lưu trữ, xoá bớt tệp để đồng bộ tiếp.`
  }
  return null
}
