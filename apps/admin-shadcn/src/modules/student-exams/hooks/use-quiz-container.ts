'use client'
import { dialog } from '@engine-dialogs'
import {
  lib_auth_currentSession as currentSession,
  deviceId,
  lib_grading_formatTrueFalse as formatTrueFalse,
  lib_auth_getSession as getSession,
  lib_grading_gradableMax as gradableMax,
  lib_grading_isAutoGraded as isAutoGraded,
  lib_grading_isFullyCorrect as isFullyCorrect,
  lib_attempts_isRemoteExamId as isRemoteExamId,
  lib_attempts_loadStudent as loadStudent,
  lib_grading_parseTrueFalse as parseTrueFalse,
  lib_grading_readTrueFalseAnswer as readTrueFalseAnswer,
  lib_attempts_saveStudent as saveStudent,
  lib_useAnimatedPresence_useAnimatedPresence as useAnimatedPresence,
  store_app_useApp as useApp,
  useParams,
} from '@student-engine'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { examsKeys, studentAttemptMutation } from '@/apis/exams'
import { t } from '@/i18n/translate-student'

import { studentKey } from './use-online-open-container'

import type { data_types_Exam as Exam, data_types_Question as Question } from '@student-engine'

export function useQuizContainer() {
  const client = useQueryClient()
  const attempt = useMutation({
    ...studentAttemptMutation(),
    onSuccess: () => client.invalidateQueries({ queryKey: examsKeys.all }),
  })
  const { id } = useParams<{
    id: string
  }>()
  const myExams = useApp((s) => s.myExams)
  const answers = useApp((s) => s.quizAnswers)
  const setAnswer = useApp((s) => s.setAnswer)
  const submitted = useApp((s) => s.quizSubmitted)
  const lastResult = useApp((s) => s.lastResult)
  const submitQuiz = useApp((s) => s.submitQuiz)
  const resetQuiz = useApp((s) => s.resetQuiz)
  const startQuiz = useApp((s) => s.startQuiz)
  const startedAt = useApp((s) => s.quizStartedAt)
  const exam = myExams.find((e) => e.id === id)
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showGrid, setShowGrid] = useState(false)
  const gridAnim = useAnimatedPresence(showGrid, 180)
  const [confirm, setConfirm] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [shuffleKey, setShuffleKey] = useState(0)
  const timerRef = useRef<number | null>(null)
  const shuffle = Boolean(exam?.settings?.shuffleQuestions)
  const questions = useMemo(
    () => shuffledQuestions(exam, shuffle, shuffleKey),
    [exam, shuffle, shuffleKey],
  )

  useEffect(() => {
    if (!showGrid) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGrid(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showGrid])
  useEffect(() => {
    if (!exam || questions.length === 0) return
    if (!submitted) startQuiz(exam.id)
  }, [exam, questions.length, startQuiz, submitted])
  useEffect(() => {
    if (!exam || submitted || exam.settings?.noTimeLimit) return
    const total = exam.durationMinutes * 60
    setRemaining((r) => r ?? total)
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r
        if (r <= 1) {
          window.clearInterval(timerRef.current!)
          submitQuiz()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [exam, submitted, submitQuiz])
  const sentFor = useRef<number | null>(null)
  const [sent, setSent] = useState<'sent' | 'failed' | 'skipped' | null>(null)
  const [scoreHidden, setScoreHidden] = useState(false)
  useEffect(() => {
    if (!submitted || !lastResult || !exam || sentFor.current === lastResult.at) return
    if (!isRemoteExamId(exam.importedFrom) || lastResult.examId !== exam.id) return
    sentFor.current = lastResult.at
    const result = lastResult
    void (async () => {
      const remote = exam.importedFrom!
      const filled = (() => {
        try {
          return sessionStorage.getItem(studentKey(remote)) === '1'
        } catch {
          return false
        }
      })()
      const info = filled ? loadStudent() : null
      const user = (await currentSession().catch(() => null))?.user ?? getSession()?.user
      let name = info?.name ?? user?.name ?? user?.email.split('@')[0] ?? ''
      if (!name) {
        const typed = await dialog.prompt(t('studentCopy.m299'), {
          title: t('studentCopy.m300'),
          label: t('studentCopy.m301'),
          defaultValue: loadStudent()?.name ?? '',
          confirmLabel: t('studentCopy.m302'),
          cancelLabel: t('studentCopy.m303'),
        })
        name = typed?.trim() ?? ''
        if (!name) {
          setSent('skipped')
          return
        }
        saveStudent({ ...(loadStudent() ?? { className: '' }), name })
      }
      try {
        const byId = new Map(
          exam.sections.flatMap((s) => s.questions).map((q) => [q.id, q.srcId ?? q.id]),
        )
        const srcAnswers = Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [byId.get(k) ?? k, v]),
        )
        const graded = await attempt.mutateAsync({
          params: { path: { id: exam.importedFrom! } },
          body: {
            name: name.trim().slice(0, 60),
            answers: srcAnswers,
            seconds: Math.max(0, Math.round(startedAt ? (result.at - startedAt) / 1000 : 0)),
            className: info?.className,
            seat: info?.seat,
            deviceId: deviceId(),
          },
        })
        if (graded.hidden) setScoreHidden(true)
        else if (typeof graded.score === 'number' && typeof graded.max === 'number')
          useApp
            .getState()
            .applyGrading(
              exam.id,
              graded.score,
              graded.max,
              graded.key ?? {},
              graded.gradable,
              graded.correct,
            )
        else throw new Error(t('studentCopy.m376'))
        setSent('sent')
      } catch {
        setSent('failed')
      }
    })()
  }, [submitted, lastResult, exam, answers, startedAt, attempt])
  if (!exam) {
    return { viewState: 0 as const }
  }
  if (questions.length === 0) {
    return { viewState: 1 as const }
  }
  const current = questions[index] ?? questions[0]!
  const answered = Object.keys(answers).length
  const totalPoints = questions.reduce((n, q) => n + q.points, 0)
  const handleSubmit = () => {
    submitQuiz()
    setConfirm(false)
  }
  const handleRestart = () => {
    resetQuiz()
    setIndex(0)
    setFlagged(new Set())
    setConfirm(false)
    setReviewing(false)
    setChecked(new Set())
    setSent(null)
    setScoreHidden(false)
    setShuffleKey((k) => k + 1)
    startQuiz(exam.id)
  }
  const locked = Boolean(
    exam.settings?.oneAttempt &&
    isRemoteExamId(exam.importedFrom) &&
    (() => {
      try {
        return sessionStorage.getItem(studentKey(exam.importedFrom!)) === '1'
      } catch {
        return false
      }
    })(),
  )
  const restart = locked ? undefined : handleRestart
  if (submitted && lastResult) {
    const localGradable = gradableMax(questions)
    const pending = isRemoteExamId(exam.importedFrom) && sent === null
    const gradable =
      sent === 'failed' && localGradable === 0
        ? totalPoints
        : (lastResult.gradable ?? localGradable)
    return {
      viewState: 2 as const,
      reviewing,
      questions,
      answers,
      index,
      setIndex,
      setReviewing,
      restart,
      exam,
      lastResult,
      totalPoints,
      gradable,
      scoreHidden,
      pending,
      sent,
    }
  }
  const mm = String(Math.floor((remaining ?? 0) / 60)).padStart(2, '0')
  const ss = String((remaining ?? 0) % 60).padStart(2, '0')
  const low = (remaining ?? 0) <= 60
  const noLimit = Boolean(exam.settings?.noTimeLimit)
  const instant = Boolean(exam.settings?.instantFeedback)
  const isChecked = instant && checked.has(current.id)
  const markChecked = () => setChecked((c) => new Set(c).add(current.id))
  return {
    viewState: 3 as const,
    exam,
    index,
    questions,
    answered,
    setShowGrid,
    noLimit,
    low,
    mm,
    ss,
    setConfirm,
    current,
    answers,
    setAnswer,
    instant,
    markChecked,
    flagged,
    setFlagged,
    isChecked,
    setIndex,
    totalPoints,
    gridAnim,
    confirm,
    handleSubmit,
  }
}
export function useLegendRowContainer({ className, label }: { className: string; label: string }) {
  return { viewState: 0 as const, className, label }
}
export function useQuestionCardContainer({
  question,
  index,
  total,
  chosen,
  onAnswer,
  flagged,
  onToggleFlag,
  review = false,
}: {
  question: Question
  index: number
  total: number
  chosen?: string
  onAnswer: (v: string) => void
  flagged: boolean
  onToggleFlag: () => void
  review?: boolean
}) {
  const graded = isAutoGraded(question)
  const ok = isFullyCorrect(question, chosen)
  return {
    viewState: 0 as const,
    index,
    total,
    review,
    graded,
    chosen,
    ok,
    onToggleFlag,
    flagged,
    question,
    onAnswer,
  }
}
export function useReviewViewContainer({
  questions,
  answers,
  index,
  setIndex,
  onBack,
  onRestart,
}: {
  questions: Question[]
  answers: Record<string, string>
  index: number
  setIndex: (i: number | ((i: number) => number)) => void
  onBack: () => void
  onRestart?: () => void
}) {
  const q = questions[index] ?? questions[0]!
  return { viewState: 0 as const, onBack, onRestart, questions, answers, setIndex, index, q }
}
export function useTrueFalseInputContainer({
  question,
  chosen,
  onAnswer,
  review = false,
}: {
  question: Question
  chosen?: string
  onAnswer: (v: string) => void
  review?: boolean
}) {
  const options = question.options ?? []
  const values = readTrueFalseAnswer(chosen, options.length)
  const correct = review ? parseTrueFalse(question.answer, options.length) : null
  const set = (i: number, v: boolean) =>
    onAnswer(formatTrueFalse(values.map((x, j) => (j === i ? v : x))))
  return { viewState: 0 as const, options, values, review, set, correct }
}
export function useShortAnswerInputContainer({
  chosen,
  onAnswer,
}: {
  chosen?: string
  onAnswer: (v: string) => void
}) {
  return { viewState: 0 as const, chosen, onAnswer }
}
export function useResultViewContainer({
  examTitle,
  score,
  totalPoints,
  gradable,
  correctCount,
  scoreHidden,
  pending,
  questions,
  answers,
  note,
  onRestart,
  onReview,
}: {
  scoreHidden?: boolean
  correctCount?: number
  note?: string
  examTitle: string
  score: number
  totalPoints: number
  gradable: number
  pending?: boolean
  questions: Question[]
  answers: Record<string, string>
  onRestart?: () => void
  onReview: () => void
}) {
  const pct = gradable > 0 ? (score / gradable) * 100 : 0
  const correct = correctCount ?? questions.filter((q) => isFullyCorrect(q, answers[q.id])).length
  const gradedCount = questions.filter((question) => isAutoGraded(question)).length
  const noKey = !pending && gradable <= 0
  const skipped = Math.round((totalPoints - gradable) * 1000) / 1000
  const grade =
    pct >= 85
      ? t('studentCopy.m304')
      : pct >= 70
        ? t('studentCopy.m305')
        : pct >= 50
          ? t('studentCopy.m306')
          : pct >= 30
            ? t('studentCopy.m307')
            : t('studentCopy.m308')
  const tone = pct >= 70 ? 'text-sage' : pct >= 50 ? 'text-honey' : 'text-clay'
  return {
    viewState: 0 as const,
    examTitle,
    pending,
    scoreHidden,
    noKey,
    score,
    gradable,
    tone,
    grade,
    correct,
    gradedCount,
    questions,
    pct,
    skipped,
    note,
    onReview,
    onRestart,
    answers,
  }
}

function shuffledQuestions(source: Exam | undefined, enabled: boolean, _revision: number) {
  const all = source ? source.sections.flatMap((s) => s.questions) : []
  if (!enabled) return all
  const out = [...all]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}
