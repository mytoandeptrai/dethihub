export const TOKENS_PER_POINT = 1000

/** limit = monthly base + credit balance; usage above base is paid from credits */
export interface Quota {
  used: number
  limit: number
  scope: 'month'
  base?: number
  credits?: number
}

export const monthKey = (date = new Date()): string => date.toISOString().slice(0, 7)

export const quotaMessage = (quota: Quota): string =>
  quota.base
    ? 'Bạn đã dùng hết điểm AI của tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.'
    : 'Bạn đã hết điểm AI. Nạp thêm điểm để tiếp tục.'

const points = (tokens: number): string =>
  Math.max(0, Math.ceil(tokens / TOKENS_PER_POINT)).toLocaleString('vi-VN')

export const shortfallMessage = (promptTokens: number, remaining: number): string =>
  `Yêu cầu này cần khoảng ${points(promptTokens + 256)} điểm AI nhưng bạn chỉ còn ${points(remaining)} điểm. Hãy rút gọn tài liệu nguồn hoặc bớt nội dung gửi kèm.`

export const remainingTokens = (quota: Quota, pendingRefund = 0): number =>
  quota.limit - quota.used + pendingRefund
