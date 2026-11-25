'use client'
import { dialog } from '@engine-dialogs'
import { useCallback, useEffect, useState } from 'react'

import { t as translate } from '@/i18n/translate-admin-pages'
import { useAdminRequests } from '@/modules/admin-pages/hooks/use-admin-requests'
import { useDrawerExit } from '@/modules/admin-pages/hooks/use-drawer-exit'

import type { SiteSelectOption } from '@/components/product-ui'
import type {
  lib_adminApi_AdminMe as AdminMe,
  lib_adminContentApi_ContentDoc as ContentDoc,
  lib_adminContentApi_ContentExam as ContentExam,
  lib_adminContentApi_ContentFeedback as ContentFeedback,
  lib_adminContentApi_ContentReport as ContentReport,
  lib_adminContentApi_ContentTopUserStorage as ContentTopUserStorage,
} from '@admin-pages-engine'
export interface ContentPanelProps {
  me: AdminMe
}
export type TabKey = 'exams' | 'reports' | 'docs' | 'feedback'
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
export const SUBJECTS_LIST = [
  translate('adminPagesCopy.m147'),
  translate('adminPagesCopy.m148'),
  translate('adminPagesCopy.m149'),
  translate('adminPagesCopy.m150'),
  translate('adminPagesCopy.m151'),
  translate('adminPagesCopy.m152'),
  translate('adminPagesCopy.m153'),
  translate('adminPagesCopy.m154'),
  translate('adminPagesCopy.m155'),
  'GDCD',
  translate('adminPagesCopy.m156'),
]
export const SUBJECT_FILTER_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m157') },
  ...SUBJECTS_LIST.map((s) => ({ value: s, label: s })),
]
export const STATUS_FILTER_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m158') },
  { value: 'published', label: translate('adminPagesCopy.m159') },
  { value: 'hidden', label: translate('adminPagesCopy.m160') },
  { value: 'removed', label: translate('adminPagesCopy.m161') },
]
export function useContentPanelContainer({ me }: ContentPanelProps) {
  const isMod = me.role === 'moderator'
  const [tab, setTab] = useState<TabKey>('exams')
  useEffect(() => {
    if (isMod && (tab === 'docs' || tab === 'feedback')) {
      setTab('exams')
    }
  }, [isMod, tab])
  const tabOptions = isMod
    ? [
        { key: 'exams' as const, label: translate('adminPagesCopy.m162') },
        { key: 'reports' as const, label: translate('adminPagesCopy.m163') },
      ]
    : [
        { key: 'exams' as const, label: translate('adminPagesCopy.m162') },
        { key: 'reports' as const, label: translate('adminPagesCopy.m163') },
        { key: 'docs' as const, label: translate('adminPagesCopy.m164') },
        { key: 'feedback' as const, label: translate('adminPagesCopy.m165') },
      ]
  return { viewState: 0 as const, tab, setTab, tabOptions, me, isMod }
}
export function useExamsTabContainer({ me }: { me: AdminMe }) {
  const { listContentExams } = useAdminRequests()
  const [exams, setExams] = useState<ContentExam[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ContentExam | null>(null)
  const perPage = 20
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])
  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentExams({
        q: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        subject: subjectFilter || undefined,
        page,
        perPage,
      })
      setExams(res.exams)
      setTotal(res.total)
      setSelectedExam((current) =>
        current ? (res.exams.find((exam) => exam.id === current.id) ?? current) : null,
      )
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m166'), error)
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m167')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m20') })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, subjectFilter, page, listContentExams])
  useEffect(() => {
    void loadExams()
  }, [debouncedSearch, statusFilter, subjectFilter, page, loadExams])
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    viewState: 0 as const,
    search,
    setSearch,
    subjectFilter,
    setSubjectFilter,
    setPage,
    statusFilter,
    setStatusFilter,
    loadExams,
    loading,
    exams,
    setSelectedExam,
    totalPages,
    page,
    selectedExam,
    me,
  }
}
export function useExamDrawerContainer({
  exam,
  me,
  onClose,
  onUpdated,
}: {
  exam: ContentExam
  me: AdminMe
  onClose: () => void
  onUpdated: () => void
}) {
  const { deleteContentExam, getContentExam, setContentExamStatus } = useAdminRequests()
  const [detail, setDetail] = useState<any>(null)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  useEffect(() => {
    let alive = true
    setLoadingDoc(true)
    getContentExam(exam.id)
      .then((res) => {
        if (!alive) return
        setDetail(res.exam)
      })
      .catch((error) => {
        if (!alive) return
        console.error(translate('adminPagesCopy.m168'), error)
      })
      .finally(() => {
        if (alive) setLoadingDoc(false)
      })
    return () => {
      alive = false
    }
  }, [exam.id, getContentExam])
  const handleSetStatus = async (status: 'published' | 'hidden') => {
    setActionBusy(true)
    try {
      await setContentExamStatus(exam.id, status)
      onUpdated()
      void dialog.alert(
        status === 'published'
          ? translate('adminPagesCopy.m169')
          : translate('adminPagesCopy.m170'),
        { title: translate('adminPagesCopy.m171') },
      )
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m172')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    } finally {
      setActionBusy(false)
    }
  }
  const handleRemove = async () => {
    const reason = await dialog.prompt(translate('adminPagesCopy.m174'), {
      title: translate('adminPagesCopy.m175'),
      danger: true,
      placeholder: translate('adminPagesCopy.m176'),
    })
    if (reason === null) return
    if (!reason.trim()) {
      void dialog.alert(translate('adminPagesCopy.m177'), {
        title: translate('adminPagesCopy.m25'),
      })
      return
    }
    setActionBusy(true)
    try {
      await setContentExamStatus(exam.id, 'removed', reason.trim())
      onUpdated()
      void dialog.alert(translate('adminPagesCopy.m178'), {
        title: translate('adminPagesCopy.m171'),
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m179')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    } finally {
      setActionBusy(false)
    }
  }
  const handleDelete = async () => {
    const ok = await dialog.confirm(
      translate('adminPagesCopy.m180', { value0: String(exam.title) }),
      {
        title: translate('adminPagesCopy.m181'),
        danger: true,
        confirmLabel: translate('adminPagesCopy.m45'),
      },
    )
    if (!ok) return
    setActionBusy(true)
    try {
      await deleteContentExam(exam.id)
      onUpdated()
      close()
      void dialog.alert(translate('adminPagesCopy.m182'), {
        title: translate('adminPagesCopy.m47'),
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m183')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    } finally {
      setActionBusy(false)
    }
  }
  const { close, panelClass } = useDrawerExit(onClose)
  const questions = detail?.doc?.blocks?.filter((b: any) => b.type === 'question') ?? []
  return {
    viewState: 0 as const,
    close,
    panelClass,
    exam,
    handleSetStatus,
    actionBusy,
    handleRemove,
    me,
    handleDelete,
    loadingDoc,
    questions,
  }
}
export function useReportsTabContainer({ me: _me }: { me: AdminMe }) {
  const { listContentReports, resolveContentReport } = useAdminRequests()
  const [reports, setReports] = useState<ContentReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'dismissed' | ''>('open')
  const [loading, setLoading] = useState(true)
  const perPage = 20
  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentReports({
        status: statusFilter || undefined,
        page,
        perPage,
      })
      setReports(res.reports)
      setTotal(res.total)
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m184'), error)
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m185')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m20') })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, listContentReports])
  useEffect(() => {
    void loadReports()
  }, [statusFilter, page, loadReports])
  const handleResolve = async (reportId: number, status: 'resolved' | 'dismissed') => {
    try {
      await resolveContentReport(reportId, status)
      void loadReports()
      void dialog.alert(
        status === 'resolved' ? translate('adminPagesCopy.m186') : translate('adminPagesCopy.m187'),
        { title: translate('adminPagesCopy.m171') },
      )
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m188')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    }
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    viewState: 0 as const,
    setStatusFilter,
    setPage,
    statusFilter,
    loadReports,
    loading,
    reports,
    handleResolve,
    totalPages,
    page,
  }
}
export function useDocsTabContainer({ me: _me }: { me: AdminMe }) {
  const { deleteContentDoc, listContentDocs } = useAdminRequests()
  const [docs, setDocs] = useState<ContentDoc[]>([])
  const [topUsers, setTopUsers] = useState<ContentTopUserStorage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const perPage = 20
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])
  const loadDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentDocs({
        q: debouncedSearch.trim() || undefined,
        page,
        perPage,
      })
      setDocs(res.docs)
      setTotal(res.total)
      setTopUsers(res.topUsers || [])
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m189'), error)
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m190')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m20') })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, listContentDocs])
  useEffect(() => {
    void loadDocs()
  }, [debouncedSearch, page, loadDocs])
  const handleDelete = async (doc: ContentDoc) => {
    const ok = await dialog.confirm(
      translate('adminPagesCopy.m191', { value0: String(doc.name) }),
      {
        title: translate('adminPagesCopy.m192'),
        danger: true,
        confirmLabel: translate('adminPagesCopy.m192'),
      },
    )
    if (!ok) return
    try {
      const res = await deleteContentDoc(doc.id)
      void loadDocs()
      const extra = res.r2Removed
        ? translate('adminPagesCopy.m193')
        : translate('adminPagesCopy.m194')
      void dialog.alert(translate('adminPagesCopy.m195', { value0: String(extra) }), {
        title: translate('adminPagesCopy.m47'),
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m196')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    }
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    viewState: 0 as const,
    topUsers,
    search,
    setSearch,
    loadDocs,
    loading,
    docs,
    handleDelete,
    totalPages,
    page,
    setPage,
  }
}
export function useFeedbackTabContainer({ me: _me }: { me: AdminMe }) {
  const { listContentFeedback, markContentFeedbackRead } = useAdminRequests()
  const [feedback, setFeedback] = useState<ContentFeedback[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [loading, setLoading] = useState(true)
  const perPage = 20
  const loadFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const readParam = readFilter === 'all' ? undefined : readFilter === 'read'
      const res = await listContentFeedback({
        read: readParam,
        page,
        perPage,
      })
      setFeedback(res.feedback)
      setTotal(res.total)
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m197'), error)
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m198')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m20') })
    } finally {
      setLoading(false)
    }
  }, [readFilter, page, listContentFeedback])
  useEffect(() => {
    void loadFeedback()
  }, [readFilter, page, loadFeedback])
  const handleToggleRead = async (f: ContentFeedback) => {
    const nextRead = !f.read
    try {
      await markContentFeedbackRead(f.id, nextRead)
      setFeedback((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, read: nextRead } : item)),
      )
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m199')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m173') })
    }
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    viewState: 0 as const,
    setReadFilter,
    setPage,
    readFilter,
    loadFeedback,
    loading,
    feedback,
    handleToggleRead,
    totalPages,
    page,
  }
}
