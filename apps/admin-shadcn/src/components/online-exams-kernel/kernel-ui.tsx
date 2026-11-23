'use client'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'

export const QuestionImageField = dynamic(
  () => import('@online-exams-kernel').then((module) => module.QuestionImageField),
  { ssr: false },
)
export const OnlineAiBox = dynamic(
  () => import('@online-exams-kernel').then((module) => module.OnlineAiBox),
  { ssr: false },
)
export const QuestionBody = dynamic(
  () => import('@online-exams-kernel').then((module) => module.QuestionBody),
  { ssr: false },
)
export const MathText = dynamic(
  () => import('@online-exams-kernel').then((module) => module.MathText),
  { ssr: false },
)
