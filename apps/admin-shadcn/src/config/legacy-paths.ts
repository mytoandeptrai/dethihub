import { appPaths } from './app-paths'

const mappings = [
  ['/soan-de', appPaths.editor.href],
  ['/bang-ve', appPaths.editor.href],
  ['/soan-slide', appPaths.editor.href],
  ['/tao-de-online/ket-qua/:id', '/online-exams/:id/results'],
  ['/tao-de-online/:id', '/online-exams/:id'],
  ['/tao-de-online', appPaths.onlineExams.href],
  ['/de-online/:id', '/play/:id'],
  ['/lam-de/:id', '/quiz/:id'],
  ['/de/:id', '/exams/:id'],
  ['/de-cong-dong', appPaths.community.href],
  ['/de-cua-toi/phan-tich', appPaths.myDocs.analytics],
  ['/de-cua-toi', appPaths.myDocs.href],
  ['/kho-tai-lieu', appPaths.library.href],
  ['/cham-trac-nghiem', appPaths.grading.href],
  ['/dang-nhap', appPaths.auth.login.href],
  ['/dang-ky', appPaths.auth.register.href],
  ['/quen-mat-khau', appPaths.auth.forgot.href],
  ['/dat-lai-mat-khau', appPaths.auth.reset.href],
  ['/ho-so/de-tai-len', appPaths.profile.uploads.href],
  ['/ho-so', appPaths.profile.href],
  ['/quyen-rieng-tu', appPaths.privacy.href],
  ['/dieu-khoan', appPaths.terms.href],
  ['/bang-gia', appPaths.pricing.href],
  ['/admin/nguoi-dung/:path*', appPaths.admin.users + '/:path*'],
  ['/admin/noi-dung/:path*', appPaths.admin.content + '/:path*'],
  ['/admin/ngan-hang/:path*', appPaths.admin.bank + '/:path*'],
  ['/admin/so-lieu/:path*', appPaths.admin.stats + '/:path*'],
  ['/admin/nap-diem/:path*', appPaths.admin.payments + '/:path*'],
  ['/admin/nhat-ky/:path*', appPaths.admin.audit + '/:path*'],
] as const

export const legacyRedirects = mappings.map(([source, destination]) => ({
  source,
  destination,
  permanent: true,
}))

export function mapLegacyPath(href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const suffix = href.search(/[?#]/)
  const pathname = suffix < 0 ? href : href.slice(0, suffix)
  for (const [source, destination] of mappings) {
    const pattern = source.replace(/\/:path\*$/, '(?:/(.*))?').replaceAll(':id', '([^/]+)')
    const match = pathname.match(new RegExp('^' + pattern + '/?$'))
    if (!match) continue
    const target = destination
      .replace(':id', match[1] ?? '')
      .replace('/:path*', match[1] ? '/' + match[1] : '')
    return target + (suffix < 0 ? '' : href.slice(suffix))
  }
  return href
}
