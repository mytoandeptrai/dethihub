export const MAX_IMAGE_PROMPT = 2000

export const normalizeImagePrompt = (raw: unknown): string =>
  typeof raw === 'string' ? raw.trim().slice(0, MAX_IMAGE_PROMPT) : ''

/** Providers sometimes write Chinese text into the picture, so prompts ask for Vietnamese, except photo prompts that say "no text" */
export const withLanguageNote = (prompt: string): string =>
  /\bno text\b/i.test(prompt)
    ? prompt
    : `${prompt}\n\nMọi chữ xuất hiện trong ảnh phải viết bằng tiếng Việt có dấu chính xác; không dùng chữ Trung, Nhật, Hàn.`

export const imageShortfall = (needed: string, left: string): string =>
  `Vẽ một ảnh cần ${needed} điểm AI, bạn chỉ còn ${left} điểm.`
