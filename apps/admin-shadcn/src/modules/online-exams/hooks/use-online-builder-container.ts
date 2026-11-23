'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  defaultMeta,
  data_types_GRADES as GRADES,
  lib_questionImage_imageToSrc as imageToSrc,
  lib_onlineExam_loadForQuiz as loadForQuiz,
  lib_onlineExam_newQuestion as newQuestion,
  lib_parseExamText_parseExamText as parseExamText,
  lib_onlineExam_questionIssue as questionIssue,
  lib_importFile_readImportFile as readImportFile,
  lib_grading_readTrueFalseAnswer as readTrueFalseAnswer,
  lib_onlineExam_sortQuestions as sortQuestions,
  data_types_SUBJECTS as SUBJECTS,
  lib_questionImage_uploadQuestionImages as uploadQuestionImages,
  useNavigate,
  store_online_useOnline as useOnline,
  useParams,
} from '@online-exams-engine'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { workspaceItemListQuery } from '@/apis/workspace'
import { inputClass } from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { useClientReady, useSession as useFrontendSession } from '@/hooks'
import { t } from '@/i18n/translate'
import { onlineMetaSchema } from '@/modules/online-exams/hooks/schema'
import { useOnlinePublication } from '@/modules/online-exams/hooks/use-online-publication'

import type {
  lib_onlineExam_OnlineItem as OnlineItem,
  data_types_ExamSettings as ExamSettings,
  lib_onlineExam_OnlineMeta as OnlineMeta,
  data_types_Question as Question,
  data_types_QuestionType as QuestionType,
} from '@online-exams-engine'
import type { ReactNode } from 'react'
export const STEPS = [
  t('onlineExamsCopy.m108'),
  t('onlineExamsCopy.m109'),
  t('onlineExamsCopy.m76'),
]
export const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']
export const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({ value: s, label: s }))
export const GRADE_OPTIONS = GRADES.map((g) => ({ value: g, label: g }))
export const textareaClass = inputClass + ' resize-y leading-relaxed'
export const oneLine = (s: string) => s.replaceAll(/\s+/g, ' ').trim()
export function useOnlineBuilderContainer() {
  const ready = useClientReady()
  const auth = useFrontendSession()
  const publication = useOnlinePublication()
  const { id } = useParams<{
    id: string
  }>()
  const navigate = useNavigate()
  const item = useOnline((s) => s.items.find((it) => it.id === id))
  const remote = useQuery({
    ...workspaceItemListQuery({ params: { query: { kind: 'online' } } }),
    enabled: ready && !!auth.session && !item,
  })
  useEffect(() => {
    const row = remote.data?.find((value) => value.id === id)
    if (!item && row && Array.isArray(row.data?.questions))
      useOnline
        .getState()
        .replaceAll([
          ...useOnline.getState().items.filter((value) => value.id !== id),
          row.data as unknown as OnlineItem,
        ])
  }, [remote.data, id, item])
  const form = useForm({
    resolver: zodResolver(onlineMetaSchema),
    mode: 'onChange',
    values: item?.meta ?? defaultMeta(),
  })
  const update = useOnline((s) => s.update)
  const loggedIn = Boolean(auth.session)
  const [step, setStep] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  if (remote.error && !item) return { viewState: 3 as const, error: remote.error.message }
  if (!ready || auth.isLoading || (!item && !!auth.session && remote.isPending))
    return { viewState: 2 as const }
  if (!item) return { viewState: 0 as const }
  const questions = item.questions
  const issues = questions.map((question) => questionIssue(question))
  const issueCount = issues.filter(Boolean).length
  const current = questions.find((q) => q.id === selectedId) ?? questions[0]
  const currentIdx = current ? questions.indexOf(current) : -1
  const setQuestions = (qs: Question[]) => update(item.id, { questions: sortQuestions(qs) })
  const setMeta = (p: Partial<OnlineMeta>) => {
    for (const key of Object.keys(p) as (keyof OnlineMeta)[]) {
      const value = p[key]
      if (value !== undefined) form.setValue(key, value, { shouldValidate: true })
    }
    update(item.id, { meta: { ...item.meta, ...p } })
  }
  const setSettings = (p: Partial<ExamSettings>) =>
    update(item.id, { settings: { ...item.settings, ...p } })
  const add = (type: QuestionType) => {
    const q = newQuestion(type)
    setQuestions([...questions, q])
    setSelectedId(q.id)
    setStep(0)
  }
  const patch = (q: Question, p: Partial<Question>) =>
    setQuestions(questions.map((x) => (x.id === q.id ? { ...x, ...p } : x)))
  const remove = (q: Question) => {
    const next = questions.filter((x) => x.id !== q.id)
    setQuestions(next)
    setSelectedId((next[Math.min(currentIdx, next.length - 1)] ?? null)?.id ?? null)
  }
  const duplicate = (q: Question) => {
    const copy = {
      ...q,
      id: Math.random().toString(36).slice(2, 10),
      options: q.options?.map((o) => ({ ...o })),
    }
    const next = [...questions]
    next.splice(questions.indexOf(q) + 1, 0, copy)
    setQuestions(next)
    setSelectedId(copy.id)
  }
  const move = (q: Question, dir: -1 | 1) => {
    const i = questions.indexOf(q)
    const other = questions[i + dir]
    if (!other || other.type !== q.type) return
    const next = [...questions]
    next[i] = other
    next[i + dir] = q
    setQuestions(next)
  }
  const importFile = async (file: File) => {
    setBusy(true)
    setFormError(null)
    setNotice(null)
    try {
      const data = await readImportFile(file, true)
      const parsed = parseExamText(data.text, data.images)
      const { noAnswer, noPrompt, imageCount, extraImages } = parsed
      const found = await uploadQuestionImages(parsed.questions)
      if (found.length === 0) throw new Error(t('onlineExamsCopy.m110'))
      setQuestions([...questions, ...found])
      if (!item.meta.title.trim()) setMeta({ title: data.title })
      setSelectedId(found[0]!.id)
      setNotice(
        t('onlineExamsCopy.m115', {
          value0: found.length,
          value1: file.name,
          value2: noAnswer ? t('onlineExamsCopy.m111', { value0: noAnswer }) : '',
          value3: imageCount ? t('onlineExamsCopy.m112', { value0: imageCount }) : '',
          value4: extraImages ? t('onlineExamsCopy.m113', { value0: extraImages }) : '',
          value5: noPrompt ? t('onlineExamsCopy.m114', { value0: noPrompt }) : '',
        }),
      )
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('onlineExamsCopy.m116'))
    } finally {
      setBusy(false)
    }
  }
  const finish = () => {
    const parsed = onlineMetaSchema.safeParse(form.getValues())
    if (!parsed.success)
      return setFormError(parsed.error.issues[0]?.message ?? t('onlineExamsCopy.m117'))
    if (questions.length === 0) return setFormError(t('onlineExamsCopy.m118'))
    const first = issues.findIndex(Boolean)
    if (first >= 0) {
      setSelectedId(questions[first]!.id)
      setStep(0)
      return setFormError(
        t('onlineExamsCopy.m119', {
          value0: issueCount,
          value1: questions[first]!.number,
          value2: issues[first] ?? '',
        }),
      )
    }
    setFormError(null)
    update(item.id, { status: 'done', meta: parsed.data as OnlineMeta })
    setStep(2)
  }
  const publish = async (listed: boolean) => {
    setBusy(true)
    setFormError(null)
    try {
      await publication.publish(item, listed)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('onlineExamsCopy.m120'))
    } finally {
      setBusy(false)
    }
  }
  const goStep = (n: number) => {
    if (n > 0 && questions.length === 0) return setFormError(t('onlineExamsCopy.m121'))
    if (n === 2 && item.status !== 'done') return finish()
    setFormError(null)
    setStep(n)
  }
  const showInCommunity = async () => {
    setBusy(true)
    setFormError(null)
    try {
      await publication.changeListed(item, true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('onlineExamsCopy.m75'))
    } finally {
      setBusy(false)
    }
  }
  const onQuiz = () => navigate(appPaths.quiz.getHref(loadForQuiz(item)))
  const onAiQuestions = (qs: Question[]) => {
    const latest = useOnline.getState().items.find((value) => value.id === item.id)
    setQuestions([...(latest?.questions ?? questions), ...qs])
    setSelectedId(qs[0]?.id ?? null)
  }
  return {
    viewState: 1 as const,
    item,
    questions,
    setPreview,
    preview,
    step,
    goStep,
    error: formError,
    notice,
    issueCount,
    fileRef,
    importFile,
    busy,
    add,
    issues,
    setSelectedId,
    current,
    setQuestions,
    currentIdx,
    patch,
    move,
    duplicate,
    remove,
    setMeta,
    setSettings,
    finish,
    loggedIn,
    publish,
    showInCommunity,
    onQuiz,
    onAiQuestions,
  }
}
export function useExamPreviewContainer({
  title,
  questions,
}: {
  title: string
  questions: Question[]
}) {
  const [answers, setAnswers] = useState(false)
  const solutions = new Map(
    questions.map((question) => {
      const counts = new Map<string, number>()
      return [
        question.id,
        (question.solution ?? []).map((text) => {
          const occurrence = counts.get(text) ?? 0
          counts.set(text, occurrence + 1)
          return { id: `${text}:${occurrence}`, text }
        }),
      ]
    }),
  )
  return { viewState: 0 as const, title, answers, setAnswers, questions, solutions }
}
export function useToggleContainer({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return { viewState: 0 as const, checked, onChange, label, hint }
}
export function useIconBtnContainer({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return { viewState: 0 as const, label, onClick, disabled, danger, children }
}
export function useQuestionEditorContainer({
  q,
  issue,
  canUp,
  canDown,
  onPatch,
  onType,
  onMove,
  onDuplicate,
  onRemove,
}: {
  q: Question
  issue: string | null
  canUp: boolean
  canDown: boolean
  onPatch: (p: Partial<Question>) => void
  onType: (questionType: QuestionType) => void
  onMove: (d: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const type = q.type === 'tu-luan-dong' ? 'tu-luan' : q.type
  const options = q.options ?? []
  const [imgBusy, setImgBusy] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const setImage = async (file: File) => {
    setImgBusy(true)
    setImgError(null)
    try {
      const src = await imageToSrc(file)
      onPatch({ image: { position: 'bottom', ...q.image, src } })
    } catch (error) {
      setImgError(error instanceof Error ? error.message : t('onlineExamsCopy.m122'))
    } finally {
      setImgBusy(false)
    }
  }
  const setOption = (i: number, text: string) =>
    onPatch({ options: options.map((o, j) => (j === i ? { ...o, text } : o)) })
  const removeOption = (i: number) => {
    const correct = options.findIndex((o) => o.key === q.answer)
    const next = options.filter((_, j) => j !== i).map((o, j) => ({ key: KEYS[j]!, text: o.text }))
    const kept = correct === i ? -1 : correct > i ? correct - 1 : correct
    onPatch({ options: next, answer: kept >= 0 ? (KEYS[kept] ?? '') : '' })
  }
  const tf = readTrueFalseAnswer(q.answer, options.length)
  return {
    viewState: 0 as const,
    q,
    onMove,
    canUp,
    canDown,
    onDuplicate,
    onRemove,
    type,
    onType,
    onPatch,
    setImage,
    imgBusy,
    imgError,
    options,
    setOption,
    removeOption,
    tf,
    issue,
  }
}
