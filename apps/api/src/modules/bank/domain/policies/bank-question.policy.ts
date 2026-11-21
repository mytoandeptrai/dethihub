export const BANK_SUBJECTS = new Set([
  'Toán',
  'Ngữ văn',
  'Tiếng Việt',
  'Tiếng Anh',
  'Vật lí',
  'Hoá học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'GDKT&PL',
])

export const BANK_TYPES = new Set([
  'trac-nghiem',
  'dung-sai',
  'tra-loi-ngan',
  'tu-luan',
  'tu-luan-dong',
])

export const MAX_VISION_IMAGES = 4

export class BankValidationError extends Error {}

const MAX_PROMPT = 5000
const IMAGE_SRC = /^(\/api\/files\/img\/|data:image\/(png|jpeg|webp|gif);base64,)/
const VISION_IMAGE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

type Raw = Record<string, unknown>

const fail = (message: string): never => {
  throw new BankValidationError(message)
}

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const isRecord = (value: unknown): value is Raw => typeof value === 'object' && value !== null

/**
 * Checks a question and returns the entry to store. Unknown keys are kept as sent (the stored entry
 * is the client's own question model); the request body size is what bounds them.
 */
export function parseQuestion(raw: Raw, id: string): Raw {
  const subject = trimmed(raw['subject'])
  if (!BANK_SUBJECTS.has(subject)) fail('Môn học không hợp lệ.')
  const type = trimmed(raw['type'])
  if (!BANK_TYPES.has(type)) fail('Loại câu hỏi không hợp lệ.')
  const prompt = trimmed(raw['prompt'])
  if (!prompt || prompt.length > MAX_PROMPT) {
    fail('Nội dung câu hỏi không được rỗng và không quá 5000 ký tự.')
  }
  const grades = raw['grades']
  if (
    !Array.isArray(grades) ||
    grades.length === 0 ||
    !grades.every((g) => typeof g === 'string' && g.trim())
  ) {
    fail('Khối lớp phải là mảng chuỗi.')
  }
  const points = Number(raw['points'])
  if (Number.isNaN(points) || points <= 0) fail('Điểm số phải là số lớn hơn 0.')

  if (type === 'trac-nghiem') {
    const options = raw['options']
    if (!Array.isArray(options) || options.length < 2) {
      fail('Câu trắc nghiệm phải có ít nhất 2 phương án.')
    }
    const list = options as unknown[]
    if (
      !list.every(
        (o) => isRecord(o) && typeof o['key'] === 'string' && typeof o['text'] === 'string',
      )
    ) {
      fail('Các phương án trắc nghiệm không hợp lệ.')
    }
    const answer = trimmed(raw['answer'])
    if (!answer || !list.some((o) => (o as Raw)['key'] === answer)) {
      fail('Đáp án phải trỏ đúng một phương án.')
    }
  }

  // The table is readable by everyone: images only from the app's own store or small embedded ones
  const image = raw['image']
  if (image !== undefined && image !== null) {
    const src = isRecord(image) ? image['src'] : undefined
    if (typeof src !== 'string' || !IMAGE_SRC.test(src)) fail('Ảnh của câu hỏi không hợp lệ.')
  }

  const tags = raw['tags']
  return {
    ...raw,
    id,
    subject,
    type,
    prompt,
    grades,
    points,
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    variable: Boolean(raw['variable']),
  }
}

/** 1..4 page images as jpeg/png/webp data URLs */
export function parseBankImages(images: unknown): string[] {
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_VISION_IMAGES) {
    return fail(`Cần từ 1 đến ${MAX_VISION_IMAGES} ảnh trang.`)
  }
  if (!images.every((image) => typeof image === 'string' && VISION_IMAGE.test(image))) {
    return fail('Ảnh phải là jpeg, png hoặc webp.')
  }
  return images as string[]
}
