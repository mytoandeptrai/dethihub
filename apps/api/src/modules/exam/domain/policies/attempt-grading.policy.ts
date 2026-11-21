import { gradableMax, scoreQuestion } from '@workspace/core'

import type { Exam, Question } from '@workspace/core'

export const ATTEMPTS_PER_STUDENT = 20
export const ANON_ATTEMPTS_PER_EXAM = 400
export const MAX_ANSWER_LENGTH = 200

export interface AnswerKeyEntry {
  answer?: string
  explanation?: string
  solution?: string[]
}

export interface GradedAttempt {
  score: number
  max: number
  gradable: number
  correct: number
  key: Record<string, AnswerKeyEntry>
}

export interface AttemptReveal {
  fullKey: boolean
  revealScore: boolean
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

/*
 * A hidden-key exam answers every submission with a probe: per-question feedback lets a student test all
 * questions in parallel, and even a total score lets them answer one question per attempt and read the
 * rest from the score. So such an exam only says "submitted"; the teacher turns showScore on to accept
 * that risk, or instantFeedback on, which makes the key public anyway.
 */
export function revealOf(listed: boolean, settings: Exam['settings']): AttemptReveal {
  const fullKey = listed || settings?.instantFeedback === true
  return { fullKey, revealScore: fullKey || settings?.showScore === true }
}

export function grade(
  questions: Question[],
  answers: Record<string, unknown>,
  fullKey: boolean,
): GradedAttempt {
  let score = 0
  let correct = 0
  const key: Record<string, AnswerKeyEntry> = {}
  for (const q of questions) {
    const given = answers[q.id]
    const text = typeof given === 'string' ? given.slice(0, MAX_ANSWER_LENGTH) : undefined
    const got = scoreQuestion(q, text)
    score += got
    if (q.points > 0 && got >= q.points) correct += 1
    if (fullKey && (q.answer || q.explanation || q.solution)) {
      key[q.id] = { answer: q.answer, explanation: q.explanation, solution: q.solution }
    }
  }
  return {
    score: round3(score),
    max: round3(questions.reduce((n, q) => n + q.points, 0)),
    gradable: gradableMax(questions),
    correct,
    key,
  }
}
