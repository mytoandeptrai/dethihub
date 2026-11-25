import { createOgImage } from '@/lib/og-image'

export const alt = 'Bảng giá Đề Thi Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return createOgImage({
    title: 'Bảng giá linh hoạt',
    description: 'Bắt đầu miễn phí. Chọn gói điểm AI phù hợp với nhu cầu giảng dạy.',
  })
}
