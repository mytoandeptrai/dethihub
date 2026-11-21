import { docToExam } from '@workspace/core'

import type { Exam, ExamDoc, Question } from '@workspace/core'

export interface StudentView {
  doc: ExamDoc
  hidden?: true
}

function withoutRoster(doc: ExamDoc): ExamDoc {
  const { online } = doc
  if (!online?.settings) return doc
  const { roster: _roster, ...settings } = online.settings
  return { ...doc, online: { ...online, settings } }
}

// Allow-list, not a deny-list: an answer field added to Question later cannot leak by being forgotten here
function visibleQuestion(q: Question): Question {
  const { id, number, type, prompt, align, image, options, points } = q
  return { id, number, type, prompt, align, image, options, points }
}

/** What a student receives when opening an exam link */
export function toStudentView(doc: ExamDoc, examId: string, listed: boolean): StudentView {
  if (listed) return { doc: withoutRoster(doc) }
  const exam = docToExam(doc, examId)
  if (exam.settings?.instantFeedback) return { doc }
  const online: Exam = {
    ...exam,
    sections: exam.sections.map((section) => ({
      id: section.id,
      title: section.title,
      points: section.points,
      questions: section.questions.map((q) => visibleQuestion(q)),
    })),
  }
  return { doc: { ...doc, blocks: [], online }, hidden: true }
}

export const toCommunityDoc = withoutRoster
