'use client'

import dynamic from 'next/dynamic'

export { MathText, QuestionBody } from '@/components/online-exams-kernel'
export { A4_PORTRAIT_W } from '@student-engine'

export const ExamEditor = dynamic(
  () => import('@student-kernel').then((module) => module.StudentExamEditor),
  { ssr: false },
)
