import Link from '@/components/navigation-link'
import { appPaths } from '@/config/app-paths'

export function PublicLinks() {
  return (
    <nav
      aria-label="Liên kết công khai"
      className="mx-auto flex max-w-[1180px] flex-wrap gap-5 px-5 py-6 text-sm text-slate-600"
    >
      <Link href={appPaths.home.href}>Trang chủ</Link>
      <Link href={appPaths.pricing.href}>Bảng giá</Link>
      <Link href={appPaths.community.href}>Đề cộng đồng</Link>
      <Link href={appPaths.terms.href}>Điều khoản</Link>
      <Link href={appPaths.privacy.href}>Bảo mật</Link>
    </nav>
  )
}
