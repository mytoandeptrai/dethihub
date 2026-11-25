'use client'

import { aiPointsLeft, useOnline } from '@engine-navigation'
import { signOut } from '@engine-pricing'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ChartColumn,
  Cpu,
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  Library,
  ListChecks,
  Plus,
  Upload,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { aiQuotaQuery } from '@/apis/ai/queries'
import { useMe } from '@/apis/me/queries'
import { useFeatureAccess } from '@/modules/feature-access/hooks/use-feature-access'
import { appPaths } from '@/config/app-paths'
import { useSession } from '@/hooks'
import { t } from '@/i18n/translate'

const storageKey = 'dethihub.sidebar-collapsed'

export function useAppShellContainer() {
  const access = useFeatureAccess()
  const canCreate = access.canUse('word') || access.canUse('slide') || access.canUse('board')
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useSession()
  const onlineItems = useOnline((state) => state.items)
  const me = useMe()
  const quota = useQuery({ ...aiQuotaQuery({}), enabled: !!session })
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const staff = me.data?.role === 'admin' || me.data?.role === 'moderator'
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(storageKey) === 'true')
    } catch {}
  }, [])
  const onCollapse = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(storageKey, String(!value))
      } catch {}
      return !value
    })
  useEffect(() => {
    setMobileOpen(false)
    setPaletteOpen(false)
  }, [pathname])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        event.isComposing
      )
        return
      if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
        )
      )
        return
      if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') ||
        (!event.ctrlKey && !event.metaKey && event.key === '[')
      ) {
        event.preventDefault()
        if (window.matchMedia('(min-width: 1024px)').matches) onCollapse()
        else setMobileOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const workspace = [
    { path: appPaths.myDocs.href, label: t('product.myDocs'), icon: FolderOpen },
    { path: appPaths.myDocs.analytics, label: t('product.analytics'), icon: ChartColumn },
    { path: appPaths.onlineExams.href, label: t('product.online'), icon: ListChecks },
    { path: appPaths.grading.href, label: t('product.grading'), icon: GraduationCap },
    { path: appPaths.profile.uploads.href, label: t('product.uploads'), icon: Upload },
  ]
  const explore = [
    { path: appPaths.library.href, label: t('product.library'), icon: Library },
    { path: appPaths.community.href, label: t('product.community'), icon: Users },
  ]
  const admin = staff
    ? [
        { path: appPaths.admin.href, label: t('product.overview'), icon: LayoutDashboard },
        { path: appPaths.admin.users, label: t('product.users'), icon: Users },
        { path: appPaths.admin.content, label: t('product.content'), icon: FileText },
        { path: appPaths.admin.bank, label: t('product.bank'), icon: BookOpen },
        { path: appPaths.admin.stats, label: t('product.stats'), icon: ChartColumn },
        { path: appPaths.admin.payments, label: t('product.payments'), icon: Wallet },
        { path: appPaths.admin.ai, label: t('product.ai'), icon: Cpu },
        { path: appPaths.admin.audit, label: t('product.audit'), icon: History },
        { path: appPaths.admin.features, label: t('product.features'), icon: Cpu },
      ]
    : []
  const create = { path: appPaths.editor.href, label: t('product.create'), icon: Plus }
  const profile = { path: appPaths.profile.href, label: t('product.account'), icon: UserRound }
  const paletteItems = [
    ...(canCreate ? [create] : []),
    ...workspace,
    ...explore,
    profile,
    ...admin,
    ...onlineItems.map((item) => ({
      path: appPaths.onlineExams.getHref(item.id),
      label: `${t('product.online')} · ${item.meta.title}`,
      icon: ListChecks,
    })),
    ...onlineItems.flatMap((item) =>
      item.publishedId
        ? [
            {
              path: appPaths.onlineExams.results(item.publishedId),
              label: `${t('product.stats')} · ${item.meta.title}`,
              icon: ChartColumn,
            },
          ]
        : [],
    ),
  ]
  const palette = [
    ...new Map(paletteItems.map((item) => [`${item.label} ${item.path}`, item])).values(),
  ]
  const onNavigate = (path: string) => {
    setMobileOpen(false)
    setPaletteOpen(false)
    router.push(path)
  }
  const onSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.requestError'))
    }
  }
  const remaining = quota.data?.quota
    ? Math.max(0, quota.data.quota.limit - quota.data.quota.used)
    : 0
  return {
    canCreate,
    pathname,
    session,
    collapsed,
    mobileOpen,
    paletteOpen,
    feedbackOpen,
    workspace,
    mobileNavigation: [
      { path: appPaths.myDocs.href, label: t('product.myDocs'), icon: FolderOpen },
      { path: appPaths.onlineExams.href, label: t('product.online'), icon: ListChecks },
      ...(canCreate ? [{ path: appPaths.editor.href, label: t('product.mobileCreate'), icon: Plus }] : []),
      { path: appPaths.grading.href, label: t('product.mobileGrading'), icon: GraduationCap },
    ],
    explore,
    admin,
    create,
    profile,
    palette,
    onNavigate,
    onCollapse,
    onSignOut,
    onMobileChange: setMobileOpen,
    onPaletteChange: setPaletteOpen,
    onFeedbackChange: setFeedbackOpen,
    points: quota.data?.unlimited
      ? t('product.unlimited')
      : t('product.points', {
          points: quota.data?.quota ? aiPointsLeft(quota.data.quota).toLocaleString('vi-VN') : '0',
        }),
    quotaFraction: quota.data?.unlimited
      ? 1
      : quota.data?.quota?.limit
        ? Math.min(1, remaining / quota.data.quota.limit)
        : 0,
  }
}
