import { docToExam, flatQuestions, missingKeyCount, totalPoints } from '@workspace/core'

import type { ExamDoc } from '@workspace/core'

export interface ExamSummaryProps {
  title: string
  subject: string
  grade: string
  school: string
  questionCount: number
  durationMinutes: number
  totalPoints: number
  preview: string
  missingKeys: number
}

/** Listing columns derived from the document, so a client cannot claim other numbers */
export class ExamSummary {
  readonly #props: ExamSummaryProps

  private constructor(props: ExamSummaryProps) {
    this.#props = props
  }

  static fromDoc(doc: ExamDoc): ExamSummary {
    const exam = docToExam(doc, doc.id)
    const questions = flatQuestions(exam)
    return new ExamSummary({
      title: doc.title,
      subject: doc.subject,
      grade: doc.grade,
      school: doc.unit,
      questionCount: questions.length,
      durationMinutes: exam.durationMinutes,
      totalPoints: totalPoints(exam),
      preview: questions[0]?.prompt ?? '',
      missingKeys: missingKeyCount(questions),
    })
  }

  static restore(props: ExamSummaryProps): ExamSummary {
    return new ExamSummary(props)
  }

  get title(): string {
    return this.#props.title
  }

  get subject(): string {
    return this.#props.subject
  }

  get grade(): string {
    return this.#props.grade
  }

  get school(): string {
    return this.#props.school
  }

  get questionCount(): number {
    return this.#props.questionCount
  }

  get durationMinutes(): number {
    return this.#props.durationMinutes
  }

  get totalPoints(): number {
    return this.#props.totalPoints
  }

  get preview(): string {
    return this.#props.preview
  }

  get missingKeys(): number {
    return this.#props.missingKeys
  }
}
