const fallbackUrl = 'https://dethihub.vercel.app'

const parse = (input?: string) => {
  try {
    const url = new URL(input ?? '')
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}
const local = (url: URL) => ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)

export function resolveSiteUrl(value?: string, vercelEnv?: string, productionHost?: string) {
  let url = parse(value)
  if ((!url || local(url)) && vercelEnv === 'production') {
    url = parse(productionHost ? `https://${productionHost}` : undefined)
    if (url && local(url)) url = null
  }
  if (!url) return fallbackUrl
  if (!local(url)) url.protocol = 'https:'
  return url.origin
}

export const site = {
  name: 'Đề Thi Hub',
  description:
    'Đề Thi Hub giúp giáo viên soạn đề thi, tạo đề online, thiết kế slide bài giảng và quản lý tài liệu dễ dàng với trợ lý AI thông minh, tiết kiệm thời gian.',
  keywords: [
    'soạn đề thi',
    'đề thi online',
    'slide bài giảng',
    'AI cho giáo viên',
    'ngân hàng câu hỏi',
    'Đề Thi Hub',
  ],
  url: resolveSiteUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_ENV,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ),
  image: '/opengraph-image',
  contentUpdatedAt: '2026-11-25T00:00:00.000Z',
}
