import { createOgImage } from '@/lib/og-image'

export const alt = 'Đề cộng đồng Đề Thi Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return createOgImage({
    title: 'Đề cộng đồng',
    description: 'Khám phá đề thi chất lượng. Chia sẻ tri thức cùng giáo viên Việt Nam.',
  })
}
