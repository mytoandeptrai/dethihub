/** Pages per call; the client splits longer documents into batches */
export const VISION_PAGES_PER_CALL = 3

/** High estimate of one call (images plus the transcribed text), used to refuse early and to hold points */
export const VISION_RESERVE_TOKENS = VISION_PAGES_PER_CALL * 2500 + 8000

const IMAGE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

export const visionShortfall = (needed: string, left: string): string =>
  `Đọc ảnh PDF cần khoảng ${needed} điểm AI mỗi lượt nhưng bạn chỉ còn ${left} điểm.`

export type VisionInput = { pages: string[] } | { error: string }

export function parseVisionImages(images: unknown): VisionInput {
  if (!Array.isArray(images) || images.length === 0 || images.length > VISION_PAGES_PER_CALL) {
    return { error: `Cần gửi từ 1 đến ${VISION_PAGES_PER_CALL} ảnh.` }
  }
  if (!images.every((image) => typeof image === 'string' && IMAGE.test(image))) {
    return { error: 'Ảnh không hợp lệ.' }
  }
  return { pages: images as string[] }
}
