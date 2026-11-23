'use client'

import { dialog } from '@engine-dialogs'
import {
  lib_attempts_summarize as summarize,
  useNavigate,
  store_online_useOnline as useOnline,
  useParams,
} from '@online-exams-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  allMyExamAttemptsQuery,
  examsKeys,
  myExamByIdQuery,
  myExamCountQuery,
  myExamListQuery,
  myExamSetListedMutation,
  myExamUnpublishMutation,
} from '@/apis/exams'
import { appPaths } from '@/config/app-paths'
import { useClientReady, useSession, useUrlState } from '@/hooks'
import { t } from '@/i18n/translate'
import {
  publishedAttempt,
  publishedCount,
  publishedRow,
} from '@/modules/online-exams/hooks/published-model'
import {
  DEMO_ROW,
  demoAttempts,
  PAGE,
} from '@/modules/online-exams/hooks/use-online-published-container'

import type { lib_community_CommunityRow as CommunityRow } from '@online-exams-engine'

export function usePublishedPanelContainer() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()
  const items = useOnline((s) => s.items)
  const [stored, setPage] = useUrlState<string>('publishedPage', '1')
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: examsKeys.all })
  const count = useQuery({ ...myExamCountQuery({}), enabled: !!session, select: publishedCount })
  const total = count.data ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(stored)) || 1))
  const list = useQuery({
    ...myExamListQuery({ params: { query: { limit: PAGE, offset: (page - 1) * PAGE } } }),
    enabled: !!session && count.data !== undefined,
  })
  const rows = useMemo(() => (list.data ?? []).map((row) => publishedRow(row)), [list.data])
  const attempts = useQuery({
    ...allMyExamAttemptsQuery(rows.map((row) => row.id)),
    enabled: !!session && rows.length > 0,
  })
  const listed = useMutation({ ...myExamSetListedMutation(), onSuccess: invalidate })
  const unpublish = useMutation({
    ...myExamUnpublishMutation(),
    onSuccess: async (_data, variables) => {
      client.setQueryData(myExamByIdQuery(variables.params.path.id).queryKey, null)
      await client.invalidateQueries({
        queryKey: examsKeys.all,
        predicate: (query) => query.queryKey[1] !== 'allAttempts',
      })
      await client.invalidateQueries({
        queryKey: [...examsKeys.all, 'allAttempts'],
        refetchType: 'none',
      })
    },
  })
  const stats = useMemo(
    () =>
      new Map(
        rows.map((row) => [
          row.id,
          summarize(
            (attempts.data ?? [])
              .filter((a) => a.examId === row.id)
              .map((attempt) => publishedAttempt(attempt)),
          ),
        ]),
      ),
    [rows, attempts.data],
  )
  const toggleListed = async (row: CommunityRow) => {
    try {
      await listed.mutateAsync({ params: { path: { id: row.id } }, body: { listed: !row.listed } })
      for (const item of useOnline.getState().items)
        if (item.publishedId === row.id)
          useOnline.getState().update(item.id, { publishedListed: !row.listed })
    } catch {}
  }
  const remove = async (row: CommunityRow) => {
    if (
      !(await dialog.confirm(t('onlineExamsCopy.m239'), {
        title: t('onlineExamsCopy.m240', { value0: row.title.trim() || t('onlineExamsCopy.m91') }),
        confirmLabel: t('onlineExamsCopy.m241'),
        danger: true,
      }))
    )
      return
    try {
      await unpublish.mutateAsync({ params: { path: { id: row.id } } })
      for (const item of useOnline.getState().items)
        if (item.publishedId === row.id)
          useOnline
            .getState()
            .update(item.id, { publishedId: undefined, publishedListed: undefined })
    } catch {}
  }
  const failure = count.error ?? list.error ?? attempts.error ?? listed.error ?? unpublish.error
  if (!session && !isLoading) return { viewState: 0 as const }
  if (
    isLoading ||
    (!failure && (count.isPending || list.isPending || (rows.length > 0 && attempts.isPending)))
  )
    return { viewState: 1 as const }
  const busyId = listed.isPending
    ? listed.variables.params.path.id
    : unpublish.isPending
      ? unpublish.variables.params.path.id
      : null
  return {
    viewState: 2 as const,
    rows,
    stats,
    items,
    page,
    pages,
    busyId,
    error: failure?.message ?? null,
    toggleListed,
    remove,
    onResults: (id: string) => navigate(appPaths.onlineExams.results(id)),
    onEdit: (id: string) => navigate(appPaths.onlineExams.getHref(id)),
    go: (next: number) => {
      setPage(String(Math.max(1, Math.min(pages, next))))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  }
}

export function useOnlineResultsContainer() {
  const { id = '' } = useParams()
  const { session, isLoading } = useSession()
  const ready = useClientReady()
  const demo = ready && process.env.NODE_ENV === 'development' && id === 'demo'
  const exam = useQuery({ ...myExamByIdQuery(id), enabled: !!session && !demo })
  const attempts = useQuery({
    ...allMyExamAttemptsQuery([id]),
    enabled: !!session && !demo && !!exam.data,
  })
  const row = demo
    ? DEMO_ROW
    : exam.data === null
      ? null
      : exam.data && !attempts.isPending
        ? publishedRow(exam.data)
        : undefined
  const stats = useMemo(
    () =>
      demo
        ? summarize(demoAttempts())
        : attempts.data
          ? summarize(attempts.data.map((attempt) => publishedAttempt(attempt)))
          : undefined,
    [demo, attempts.data],
  )
  const identities = new Map<string, number>()
  const studentRows = (stats?.students ?? []).map((student, index) => {
    const fingerprint = JSON.stringify(student)
    const occurrence = identities.get(fingerprint) ?? 0
    identities.set(fingerprint, occurrence + 1)
    return { id: `${fingerprint}:${occurrence}`, student, rank: index + 1 }
  })
  return {
    viewState: 0 as const,
    session,
    id,
    demo,
    isLoading,
    error: exam.error?.message ?? attempts.error?.message,
    row,
    students: stats?.students ?? [],
    studentRows,
    stats,
  }
}
