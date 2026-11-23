import { matchPath } from 'react-router-dom'
import { BarChart3, BookOpen, ChartColumn, Cpu, FileText, Files, FolderOpen, GraduationCap, History, LayoutDashboard, Library, ListChecks, Presentation, Upload, Users, Wallet } from 'lucide-react'

export const WORKSPACE_NAV = [
  { path: '/de-cua-toi', label: 'Đề của tôi', icon: FolderOpen, end: true },
  { path: '/de-cua-toi/phan-tich', label: 'Đề tương tác', icon: BarChart3, end: true },
  { path: '/tao-de-online', label: 'Đề online', icon: ListChecks, end: false },
  { path: '/cham-trac-nghiem', label: 'Chấm trắc nghiệm', icon: GraduationCap, end: true },
  { path: '/ho-so/de-tai-len', label: 'Tệp đã lưu', icon: Upload, end: true },
]
export const EXPLORE_NAV = [
  { path: '/kho-tai-lieu', label: 'Tài liệu tham khảo', icon: Library, end: true },
  { path: '/de-cong-dong', label: 'Đề cộng đồng', icon: Users, end: true },
]
export const ADMIN_NAV = [
  { path: '/admin', label: 'Tổng hợp', icon: LayoutDashboard, end: true },
  { path: '/admin/nguoi-dung', label: 'Tài khoản', icon: Users, end: false },
  { path: '/admin/noi-dung', label: 'Duyệt nội dung', icon: FileText, end: false },
  { path: '/admin/ngan-hang', label: 'Câu hỏi', icon: BookOpen, end: false },
  { path: '/admin/so-lieu', label: 'Thống kê', icon: ChartColumn, end: false },
  { path: '/admin/nap-diem', label: 'Giao dịch', icon: Wallet, end: false },
  { path: '/admin/ai', label: 'AI & hạ tầng', icon: Cpu, end: false },
  { path: '/admin/nhat-ky', label: 'Lịch sử quản trị', icon: History, end: false },
]
export type AppNavItem = (typeof WORKSPACE_NAV)[number]
export const APP_ROUTE_PATTERNS = [
  ...WORKSPACE_NAV.map((item) => item.path), ...EXPLORE_NAV.map((item) => item.path),
  '/ho-so', '/tao-de-online/:id', '/tao-de-online/ket-qua/:id', '/admin/*',
]
export function isAppRoute(pathname: string) {
  return APP_ROUTE_PATTERNS.some((path) => matchPath({ path, end: true }, pathname))
}
export function appRouteTitle(pathname: string) {
  if (matchPath('/tao-de-online/ket-qua/:id', pathname)) return 'Bài nộp đề online'
  if (matchPath('/tao-de-online/:id', pathname)) return 'Biên soạn đề online'
  if (matchPath('/ho-so', pathname)) return 'Tài khoản'
  return [...WORKSPACE_NAV, ...EXPLORE_NAV, ...ADMIN_NAV].find((item) => matchPath({ path: item.path, end: item.end }, pathname))?.label ?? 'Quản trị'
}

export const CREATE_NAV = { path: '/soan-de', label: 'Soạn đề mới', icon: Presentation }
export const PROFILE_NAV = { path: '/ho-so', label: 'Tài khoản', icon: Files }
