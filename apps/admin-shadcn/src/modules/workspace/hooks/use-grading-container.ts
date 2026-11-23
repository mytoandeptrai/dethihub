'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { lib_grading_parseChoiceKey as parseChoiceKey } from '@workspace-engine'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { t } from '@/i18n/translate'
export interface AnswerKey {
  id: string
  label: string
  key: string
}
export const KEYS: AnswerKey[] = [
  {
    id: 'k1',
    label: t('workspaceCopy.m468'),
    key: '1B 2C 3A 4D 5B 6A 7C 8D 9B 10A 11C 12D 13A 14B 15C 16D 17A 18B 19C 20D',
  },
  {
    id: 'k2',
    label: t('workspaceCopy.m469'),
    key: '1A 2D 3B 4C 5A 6C 7B 8A 9D 10C 11B 12A',
  },
  {
    id: 'k3',
    label: t('workspaceCopy.m470'),
    key: '1C 2A 3B 4A 5D 6C 7B 8A 9C 10D 11A 12B',
  },
]
export function useGradingContainer() {
  const fileRef = useRef<HTMLInputElement>(null)
  const schema = z.object({
    selectedKey: z.enum(['k1', 'k2', 'k3']),
    studentName: z.string().trim(),
    studentCode: z.string().trim(),
  })
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { selectedKey: 'k1' as const, studentName: '', studentCode: '' },
  })
  const fields = useWatch({ control: form.control })
  const selectedKey = fields.selectedKey ?? 'k1'
  const studentName = fields.studentName ?? ''
  const studentCode = fields.studentCode ?? ''
  const setStudentName = (value: string) => form.setValue('studentName', value)
  const setStudentCode = (value: string) => form.setValue('studentCode', value)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<{
    score: number
    total: number
    correct: number
    wrong: number
    blank: number
    details: {
      i: number
      given: string
      correct: string
      ok: boolean
    }[]
  } | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readerRef = useRef<FileReader | null>(null)
  useEffect(
    () => () => {
      clearTimeout(timer.current ?? 0)
      readerRef.current?.abort()
    },
    [],
  )
  const key = KEYS.find((k) => k.id === selectedKey)!
  const keyLetters = useMemo(() => parseChoiceKey(key.key), [key])
  const handleFile = (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError(t('workspaceCopy.gradingImageError'))
      return
    }
    readerRef.current?.abort()
    clearTimeout(timer.current ?? 0)
    const reader = new FileReader()
    readerRef.current = reader
    reader.addEventListener('error', () => {
      setScanning(false)
      setError(t('workspaceCopy.gradingReadError'))
    })
    reader.addEventListener('load', () => {
      setImage(String(reader.result))
      setScanning(true)
      timer.current = setTimeout(() => {
        const picked = keyLetters.map((l, i) => (i % 7 === 3 ? '' : l))
        setAnswers(picked)
        setScanning(false)
      }, 1400)
    })
    reader.readAsDataURL(file)
  }
  const questions = keyLetters.map((letter, index) => ({
    id: `question-${index + 1}`,
    index,
    letter,
  }))
  const grade = form.handleSubmit((values) => {
    setStudentName(values.studentName)
    setStudentCode(values.studentCode)
    const details = keyLetters.map((correct, i) => {
      const given = answers[i] ?? ''
      return { i: i + 1, given: given || '—', correct, ok: given === correct }
    })
    const correct = details.filter((d) => d.ok).length
    const blank = details.filter((detail) => detail.given === '—').length
    const wrong = details.length - correct - blank
    setResult({ score: correct, total: details.length, correct, wrong, blank, details })
  })
  const reset = () => {
    setAnswers([])
    setResult(null)
  }
  const setSelectedKey = (value: string) => {
    const parsed = schema.shape.selectedKey.safeParse(value)
    if (!parsed.success || parsed.data === selectedKey) return
    form.setValue('selectedKey', parsed.data)
    reset()
  }
  const toggleAnswer = (index: number, letter: string) => {
    const next = Array.from({ length: keyLetters.length }, (_, i) => answers[i] ?? '')
    next[index] = answers[index] === letter ? '' : letter
    setAnswers(next)
    setResult(null)
  }
  return {
    viewState: 0 as const,
    keyLetters,
    questions,
    selectedKey,
    setSelectedKey,
    studentName,
    setStudentName,
    studentCode,
    setStudentCode,
    fileRef,
    image,
    handleFile,
    scanning,
    answers,
    result,
    grade,
    reset,
    toggleAnswer,
    error,
  }
}
export function useStatContainer({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ink' | 'sage' | 'clay' | 'ink-3'
}) {
  const colors = {
    'ink': 'text-ink',
    'sage': 'text-sage',
    'clay': 'text-clay',
    'ink-3': 'text-ink-3',
  }
  return { viewState: 0 as const, label, colors, tone, value }
}
