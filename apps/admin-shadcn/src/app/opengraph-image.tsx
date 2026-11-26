import { site } from '@/config/site'
import { createOgImage } from '@/lib/og-image'

export const alt = 'Đề Thi Hub — Soạn đề thi và bài giảng với AI'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return createOgImage({
    title: site.name,
    description: 'Soạn đề thi, tạo đề online và slide bài giảng với trợ lý AI dành cho giáo viên.',
  })
}
