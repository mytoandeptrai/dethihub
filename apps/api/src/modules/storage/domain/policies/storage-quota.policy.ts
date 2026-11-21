export const IMAGE_MAX_TOTAL_BYTES = 100 * 1024 * 1024

const MB = 1024 * 1024

export function checkDocumentQuota(used: number, max: number, size: number): string | null {
  if (used + size <= max) return null
  const left = (Math.max(max - used, 0) / MB).toFixed(1)
  return `Tệp vượt dung lượng còn lại (${left} MB). Xoá bớt tệp ở trang Hồ sơ để tải tiếp.`
}

export function checkImageQuota(used: number, size: number): string | null {
  if (used + size <= IMAGE_MAX_TOTAL_BYTES) return null
  return `Đã dùng hết ${Math.round(IMAGE_MAX_TOTAL_BYTES / MB)} MB ảnh tải lên.`
}
