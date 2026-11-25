'use client'
import {
  data_community_COMMUNITY_EXAMS as COMMUNITY_EXAMS,
  lib_answerKeyWarn_confirmQuizWithoutKey as confirmQuizWithoutKey,
  lib_docToExam_docToExam as docToExam,
  lib_community_getCommunityDoc as getCommunityDoc,
  data_types_GRADES as GRADES,
  lib_community_listCommunityAuthors as listCommunityAuthors,
  lib_community_listCommunityDocs as listCommunityDocs,
  lib_community_publishDoc as publishDoc,
  lib_onlinePublish_publishItem as publishItem,
  data_types_questionCount as questionCount,
  data_types_SUBJECTS as SUBJECTS,
  data_types_totalPoints as totalPoints,
  store_app_useApp as useApp,
  store_docs_useDocStore as useDocStore,
  useNavigate,
  toCommunityRow,
  store_online_useOnline as useOnline,
  examEditor_useSlidingThumb_useSlidingThumb as useSlidingThumb,
} from '@community-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid2x2, List } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { examsKeys } from '@/apis/exams'
import { appPaths } from '@/config/app-paths'
import { useSession as useAuthSession, usePaged } from '@/hooks'
import { t } from '@/i18n/translate-community'

import type {
  lib_community_CommunityAuthor as CommunityAuthor,
  lib_community_CommunityRow as CommunityRow,
  data_types_Exam as Exam,
} from '@community-engine'
import type { components } from '@workspace/api-types'
export interface CardItem {
  id: string
  title: string
  subject: string
  grade: string
  school: string
  questions: number
  minutes: number
  points: number
  preview: string
  text: string
  mine: boolean
  author?: CommunityAuthor
  date?: string
  views?: number
  likes: number
  missingKeys?: number | null
  onView: () => void
  onQuiz: () => void
}
const EMPTY_DOCS: CommunityRow[] = []
const EMPTY_AUTHORS = new Map<string, CommunityAuthor>()
export const SUBJECT_OPTIONS = [
  { value: '', label: t('communityCopy.m37') },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]
export const GRADE_OPTIONS = [
  { value: '', label: t('communityCopy.m39') },
  ...GRADES.map((g) => ({ value: g, label: g })),
]
export const SORT_OPTIONS: {
  value: 'new' | 'popular'
  label: string
}[] = [
  { value: 'new', label: t('communityCopy.m1') },
  { value: 'popular', label: t('communityCopy.m404') },
]
export const keyLabel = (item: CardItem) =>
  (item.missingKeys ?? 0) >= item.questions
    ? t('communityCopy.m405')
    : t('communityCopy.m406', { value0: String(item.missingKeys ?? 0) })
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}
export function strip(s: string) {
  return s.replaceAll(/\$[^$]*\$/g, '')
}
export function useCommunityContainer(options?: {
  initialExams?: components['schemas']['ExamCardDto'][]
}) {
  const navigate = useNavigate()
  const importExam = useApp((s) => s.importExam)
  const { session, isLoading } = useAuthSession()
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<'new' | 'popular'>('new')
  const queryClient = useQueryClient()
  const docsQuery = useQuery({
    queryKey: [...examsKeys.all, 'community'],
    queryFn: listCommunityDocs,
    initialData: options?.initialExams?.map(toCommunityRow),
    refetchOnMount: 'always',
    enabled: !isLoading,
  })
  const userDocs = docsQuery.data ?? EMPTY_DOCS
  const authorIds = [
    ...new Set(userDocs.flatMap((row) => (row.owner_id ? [row.owner_id] : []))),
  ].toSorted()
  const authorsQuery = useQuery({
    queryKey: [...examsKeys.all, 'authors', authorIds],
    queryFn: () => listCommunityAuthors(authorIds),
    enabled: authorIds.length > 0,
  })
  const authors = authorsQuery.data ?? EMPTY_AUTHORS
  const loading = docsQuery.isPending
  const [publishOpen, setPublishOpen] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const openError =
    operationError ?? docsQuery.error?.message ?? authorsQuery.error?.message ?? null
  const loadDocs = async () => {
    await queryClient.invalidateQueries({ queryKey: examsKeys.all })
    setPublishOpen(false)
  }
  const handleInteractive = useCallback(
    (exam: Exam) => {
      const id = importExam(exam)
      useApp.getState().startQuiz(id)
      navigate(appPaths.quiz.getHref(id))
    },
    [importExam, navigate],
  )
  const openUserDoc = useCallback(
    async (row: CommunityRow, mode: 'view' | 'quiz') => {
      setOpeningId(row.id)
      setOperationError(null)
      try {
        const doc = await queryClient.fetchQuery({
          queryKey: [...examsKeys.all, 'document', row.id],
          queryFn: () => getCommunityDoc(row.id),
        })
        const exam = docToExam(doc, row.id)
        if (mode === 'quiz' && !(await confirmQuizWithoutKey(exam))) return
        const { importExam: doImport, startQuiz } = useApp.getState()
        const id = doImport(exam)
        if (mode === 'quiz') startQuiz(id)
        navigate(mode === 'quiz' ? appPaths.quiz.getHref(id) : appPaths.exams.getHref(id))
      } catch (error) {
        setOperationError(error instanceof Error ? error.message : t('communityCopy.m279'))
      } finally {
        setOpeningId(null)
      }
    },
    [navigate, queryClient],
  )
  const items = useMemo<CardItem[]>(() => {
    const mine: CardItem[] = userDocs.map((d) => {
      const author = d.owner_id ? (authors.get(d.owner_id) ?? {}) : {}
      const authorLabel = author.name?.trim() || t('communityCopy.m407')
      return {
        id: d.id,
        title: d.title,
        subject: d.subject,
        grade: d.grade,
        school: d.school,
        questions: d.question_count,
        minutes: d.duration_minutes,
        points: d.total_points,
        preview: d.preview,
        text: `${d.title} ${d.school} ${d.subject} ${d.preview} ${authorLabel}`.toLowerCase(),
        mine: true,
        author,
        missingKeys: d.missing_keys,
        date: d.created_at,
        likes: 0,
        onView: () => void openUserDoc(d, 'view'),
        onQuiz: () => void openUserDoc(d, 'quiz'),
      }
    })
    const samples: CardItem[] = COMMUNITY_EXAMS.map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      grade: e.grade,
      school: e.school,
      questions: questionCount(e),
      minutes: e.durationMinutes,
      points: totalPoints(e),
      preview: e.sections[0]?.questions[0]?.prompt ?? '',
      text: [
        e.title,
        e.school,
        e.subject,
        ...e.sections.flatMap((s) => s.questions.map((qq) => strip(qq.prompt))),
      ]
        .join(' ')
        .toLowerCase(),
      mine: false,
      views: e.views,
      likes: e.likes,
      onView: () => navigate(appPaths.exams.getHref(e.id)),
      onQuiz: () => handleInteractive(e),
    }))
    return [...mine, ...samples]
  }, [userDocs, authors, navigate, handleInteractive, openUserDoc])
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = items.filter(
      (it) =>
        (!subject || it.subject === subject) &&
        (!grade || it.grade === grade) &&
        (!needle || it.text.includes(needle)),
    )
    return sort === 'popular' ? [...list].toSorted((a, b) => b.likes - a.likes) : list
  }, [items, q, subject, grade, sort])
  const hasFilter = Boolean(q || subject || grade)
  const paged = usePaged(results, 12, `${q}|${subject}|${grade}|${sort}|${view}`)
  const clearFilters = () => {
    setQ('')
    setSubject('')
    setGrade('')
  }
  return {
    viewState: 0 as const,
    results,
    setPublishOpen,
    publishOpen,
    session,
    loadDocs,
    q,
    setQ,
    subject,
    setSubject,
    grade,
    setGrade,
    sort,
    setSort,
    view,
    setView,
    hasFilter,
    clearFilters,
    openError,
    loading,
    paged,
    openingId,
  }
}
export function usePublishModalContainer({
  loggedIn,
  onClose,
  onPublished,
}: {
  loggedIn: boolean
  onClose: () => void
  onPublished: () => void
}) {
  const myDocs = useDocStore((s) => s.myDocs)
  const onlineItems = useOnline((s) => s.items)
  const docs = myDocs.filter((d) => (d.kind ?? 'exam') === 'exam')
  const online = onlineItems.filter((it) => it.status === 'done' && it.questions.length > 0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [publicationError, setPublicationError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const publication = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examsKeys.all }),
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const publish = async (id: string, run: () => Promise<unknown>) => {
    setBusyId(id)
    setPublicationError(null)
    try {
      await publication.mutateAsync(run)
      onPublished()
    } catch (error) {
      setPublicationError(error instanceof Error ? error.message : t('communityCopy.m408'))
    } finally {
      setBusyId(null)
    }
  }
  const publishLocalDoc = async (id: string) => {
    const doc = docs.find((d) => d.id === id)
    if (doc) await publish(id, () => publishDoc(doc, true))
  }
  const publishOnline = async (id: string) => {
    const item = online.find((it) => it.id === id)
    if (item) await publish(id, () => publishItem(item, true))
  }
  return {
    viewState: 0 as const,
    onClose,
    loggedIn,
    docs,
    online,
    busyId,
    publishLocalDoc,
    publishOnline,
    error: publicationError,
  }
}
export function useExamCardContainer({
  item,
  index,
  busy,
}: {
  item: CardItem
  index: number
  busy: boolean
}) {
  const authorName = item.author ? item.author.name?.trim() || t('communityCopy.m407') : ''
  return { viewState: 0 as const, index, item, busy, authorName }
}
export function useKeyBadgeContainer({ item }: { item: CardItem }) {
  if (!item.missingKeys) return { viewState: 0 as const }
  return { viewState: 1 as const, item }
}
export function useExamRowContainer({ item, busy }: { item: CardItem; busy: boolean }) {
  const authorName = item.author ? item.author.name?.trim() || t('communityCopy.m407') : ''
  return { viewState: 0 as const, item, busy, authorName }
}
export function useViewToggleContainer({
  value,
  onChange,
}: {
  value: 'grid' | 'list'
  onChange: (v: 'grid' | 'list') => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-checked="true"]', value)
  const options = [
    { key: 'grid' as const, label: t('communityCopy.m32'), Icon: Grid2x2 },
    { key: 'list' as const, label: t('communityCopy.m33'), Icon: List },
  ]
  return { viewState: 0 as const, ref, thumb, options, value, onChange }
}
