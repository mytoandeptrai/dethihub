'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  deviceId,
  lib_docToExam_docToExam as docToExam,
  lib_attempts_loadStudent as loadStudent,
  lib_attempts_saveStudent as saveStudent,
  store_app_useApp as useApp,
  useNavigate,
  useParams,
} from '@student-engine'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { studentPlayQuery } from '@/apis/exams'
import { appPaths } from '@/config/app-paths'
import { useClientReady } from '@/hooks/use-client-ready'
import { useSession } from '@/hooks/use-session'

import { decodeStudentDoc, studentSchema } from './student-model'

import type {
  data_types_Exam as Exam,
  lib_attempts_StudentInfo as StudentInfo,
} from '@student-engine'

export const studentKey = (remoteId: string) => `dethinhbien-student-ok:${remoteId}`
export function useOnlineOpenContainer() {
  const { id } = useParams<{
    id: string
  }>()
  const navigate = useNavigate()
  const ready = useClientReady()
  const { session, isLoading } = useSession()
  const device = useMemo(() => (ready ? deviceId() : ''), [ready])
  const play = useQuery({
    ...studentPlayQuery(id ?? '', device),
    enabled: ready && Boolean(id && device) && !isLoading,
    select: (data) => ({ ...data, doc: decodeStudentDoc(data.doc) }),
  })
  const exam = useMemo(() => (play.data ? docToExam(play.data.doc, id!) : null), [play.data, id])
  const done = Boolean(exam?.settings?.oneAttempt && play.data?.gate.attempted)
  const needLogin = Boolean(exam?.settings?.oneAttempt && !session)
  const start = useCallback(
    (e: Exam) => {
      const app = useApp.getState()
      const localId = app.importExam(e)
      app.startQuiz(localId)
      navigate(appPaths.quiz.getHref(localId), { replace: true })
    },
    [navigate],
  )
  const onStudentStart = (info: StudentInfo) => {
    if (!exam || !id) return
    saveStudent(info)
    try {
      sessionStorage.setItem(studentKey(id), '1')
    } catch {}
    start(exam)
  }
  useEffect(() => {
    if (!play.data || !exam || done || needLogin) return
    if (play.data.gate.listed) start(exam)
  }, [play.data, done, needLogin, exam, start])
  if (play.error || done) return { viewState: 0 as const, done, error: play.error?.message }
  if (needLogin)
    return {
      viewState: 1 as const,
      loginHref: appPaths.auth.login.getHref(appPaths.play.getHref(id!)),
    }
  if (exam) return { viewState: 2 as const, exam, onStudentStart }
  return { viewState: 3 as const }
}
export function useStudentFormContainer({
  exam,
  onStart,
}: {
  exam: Exam
  onStart: (s: StudentInfo) => void
}) {
  const roster = exam.settings?.roster ?? []
  const saved = loadStudent()
  const schema = studentSchema(roster)
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: saved?.name ?? '',
      className: saved?.className ?? '',
      seat: saved?.seat ? String(saved.seat) : '',
    },
  })
  const values = useWatch({ control: form.control })
  const name = values.name ?? ''
  const className = values.className ?? ''
  const seat = values.seat ?? ''
  const setName = (value: string) => form.setValue('name', value, { shouldValidate: true })
  const setClassName = (value: string) =>
    form.setValue('className', value, { shouldValidate: true })
  const setSeat = (value: string) =>
    form.setValue('seat', value.replaceAll(/\D/g, ''), { shouldValidate: true })
  const err =
    form.formState.errors.name?.message ??
    form.formState.errors.className?.message ??
    form.formState.errors.seat?.message
  const rosterIdx = roster.indexOf(name)
  const submit = form.handleSubmit((input) => {
    const n = roster.length > 0 ? rosterIdx + 1 : Number(seat)
    onStart({ name: input.name, className: input.className, seat: n > 0 ? n : undefined })
  })
  return {
    viewState: 0 as const,
    exam,
    submit,
    roster,
    rosterIdx,
    name,
    setName,
    className,
    setClassName,
    seat,
    setSeat,
    err,
  }
}
