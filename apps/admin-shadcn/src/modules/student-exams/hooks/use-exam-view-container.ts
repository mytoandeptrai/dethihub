'use client'
import { dialog } from '@engine-dialogs'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  examEditor_convert_blocksToTipTap as blocksToTipTap,
  data_community_COMMUNITY_EXAMS as COMMUNITY_EXAMS,
  lib_answerKeyWarn_confirmQuizWithoutKey as confirmQuizWithoutKey,
  lib_auth_currentSession as currentSession,
  docToExam,
  lib_exportDocx_examToDoc as examToDoc,
  lib_onlineExam_examToDraft as examToDraft,
  lib_exportDocx_exportDocx as exportDocx,
  lib_attempts_isRemoteExamId as isRemoteExamId,
  store_app_useApp as useApp,
  store_compose_useComposeStore as useComposeStore,
  store_docs_useDocStore as useDocStore,
  useNavigate,
  store_online_useOnline as useOnline,
  useParams,
} from '@student-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { communityExamCommunityDocQuery, examReportMutation, examsKeys } from '@/apis/exams'
import { A4_PORTRAIT_W } from '@/components/student-kernel'
import { appPaths } from '@/config/app-paths'
import { useClientReady } from '@/hooks/use-client-ready'
import { useSession } from '@/hooks/use-session'
import { t } from '@/i18n/translate'

import { decodeStudentDoc } from './student-model'

import type { data_types_Exam as Exam, data_docTypes_ExamDoc as ExamDoc } from '@student-engine'

export function useExamViewContainer(
  options?: { serverSummary?: boolean; initialDoc?: ExamDoc } | void,
) {
  const { serverSummary = false, initialDoc } = options ?? {}
  const ready = useClientReady()
  const { isLoading: authLoading } = useSession()
  const { id } = useParams<{
    id: string
  }>()
  const navigate = useNavigate()
  const myExams = useApp((s) => s.myExams)
  const importExam = useApp((s) => s.importExam)
  const startQuiz = useApp((s) => s.startQuiz)
  const remote = useQuery({
    ...communityExamCommunityDocQuery({ params: { path: { id: id ?? '' } } }),
    enabled: ready && !authLoading && isRemoteExamId(id),
    select: decodeStudentDoc,
    initialData: initialDoc ? { ...initialDoc } : undefined,
    retry: false,
    staleTime: 30_000,
  })
  const exam = useMemo(
    () =>
      myExams.find((e) => e.id === id) ??
      COMMUNITY_EXAMS.find((e) => e.id === id) ??
      (remote.data ? { ...docToExam(remote.data, id!), importedFrom: id } : undefined),
    [id, myExams, remote.data],
  )
  if (!ready || (isRemoteExamId(id) && remote.isPending && !exam)) return { viewState: 2 as const }
  if (!exam) {
    return { viewState: 0 as const, error: remote.error?.message }
  }
  const isMine = myExams.some((e) => e.id === id)
  const handleInteractive = async () => {
    if (!isMine) {
      if (!(await confirmQuizWithoutKey(exam))) return
      const importedId = importExam(exam)
      useApp.getState().startQuiz(importedId)
      navigate(appPaths.quiz.getHref(importedId))
      return
    }
    startQuiz(exam.id)
    navigate(appPaths.quiz.getHref(exam.id))
  }
  return {
    viewState: 1 as const,
    serverSummary,
    exam,
    handleInteractive,
    id,
    print: () => window.print(),
    download: () => exportDocx(exam),
  }
}
export function useSaveMenuContainer({ exam }: { exam: Exam }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  const toOnline = () => {
    const draft = examToDraft(exam)
    navigate(appPaths.onlineExams.getHref(useOnline.getState().create(draft)))
  }
  const toEditor = async () => {
    setBusy(true)
    try {
      const remote = isRemoteExamId(exam.importedFrom)
        ? await client
            .fetchQuery(
              communityExamCommunityDocQuery({ params: { path: { id: exam.importedFrom } } }),
            )
            .then(decodeStudentDoc)
            .catch(() => null)
        : null
      const base = remote?.blocks.length ? remote : examToDoc(exam, { withAnswers: true })
      const now = new Date().toISOString()
      const doc = {
        ...base,
        id: Math.random().toString(36).slice(2, 10),
        online: undefined,
        kind: 'exam' as const,
        createdAt: now,
        updatedAt: now,
      }
      useDocStore.getState().saveDocById(doc)
      useComposeStore.getState().openDoc(doc)
      navigate(appPaths.editor.href, { state: { openTab: true } })
    } catch (error) {
      void dialog.alert(error instanceof Error ? error.message : t('studentCopy.m370'))
    } finally {
      setBusy(false)
    }
  }
  const item =
    'flex w-full items-start gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors hover:bg-sunken disabled:opacity-50'
  return { viewState: 0 as const, ref, setOpen, open, busy, item, toOnline, toEditor }
}
export function useDocViewContainer({ exam }: { exam: Exam }) {
  const remote = useQuery({
    ...communityExamCommunityDocQuery({ params: { path: { id: exam.importedFrom ?? '' } } }),
    enabled: isRemoteExamId(exam.importedFrom),
    select: decodeStudentDoc,
    retry: false,
    staleTime: 30_000,
  })
  const blocks = useMemo(() => {
    const doc = remote.data
    return doc?.blocks?.length ? doc.blocks : examToDoc(exam).blocks
  }, [remote.data, exam])
  const [zoom, setZoom] = useState(1)
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => setZoom(Math.min(1, box.clientWidth / A4_PORTRAIT_W)))
    ro.observe(box)
    return () => ro.disconnect()
  }, [])
  const content = useMemo(() => (blocks ? blocksToTipTap(blocks) : null), [blocks])
  return { viewState: 0 as const, boxRef, content, zoom }
}
export function useReportExamButtonContainer({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const client = useQueryClient()
  const report = useMutation({
    ...examReportMutation(),
    onSuccess: () => client.invalidateQueries({ queryKey: examsKeys.all }),
  })
  const form = useForm({
    resolver: zodResolver(
      z.object({ reason: z.string().trim().min(1), detail: z.string().trim().max(1000) }),
    ),
    defaultValues: { reason: t('studentCopy.m371'), detail: '' },
  })
  const values = useWatch({ control: form.control })
  const reason = values.reason ?? ''
  const detail = values.detail ?? ''
  const setReason = (value: string) => form.setValue('reason', value, { shouldValidate: true })
  const setDetail = (value: string) => form.setValue('detail', value, { shouldValidate: true })
  const submitting = report.isPending
  const handleOpen = async () => {
    const s = await currentSession()
    if (!s) {
      void dialog.alert(t('studentCopy.m372'), { title: t('studentCopy.m373') })
      return
    }
    setOpen(true)
  }
  const handleSubmit = form.handleSubmit(async (input) => {
    try {
      if (!(await currentSession())) throw new Error(t('studentCopy.m372'))
      await report.mutateAsync({ params: { path: { id: examId } }, body: input })
      setOpen(false)
      setDetail('')
      void dialog.alert(t('studentCopy.m374'), {
        title: t('studentCopy.m375'),
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('studentCopy.m376')
      void dialog.alert(msg, { title: t('studentCopy.m377') })
    }
  })
  return {
    viewState: 0 as const,
    handleOpen,
    open,
    setOpen,
    handleSubmit,
    reason,
    setReason,
    detail,
    setDetail,
    submitting,
  }
}
