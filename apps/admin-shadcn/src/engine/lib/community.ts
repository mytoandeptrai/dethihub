import * as requests from '@/apis/exams/requests'
import { submitFeedback as sendFeedback } from '@/apis/feedback/requests'
import { confirmPublishWithoutKey } from '@/engine/lib/answerKeyWarn'
import { AuthError, currentSession } from '@/engine/lib/auth'
import { docToExam } from '@/engine/lib/docToExam'

import type { ExamDoc } from '@/engine/data/docTypes'
import type { components } from '@workspace/api-types'

export interface CommunityRow {
  id: string
  owner_id?: string | null
  title: string
  subject: string
  grade: string
  school: string
  created_at: string
  question_count: number
  duration_minutes: number
  total_points: number
  preview: string
  listed: boolean
  missing_keys?: number | null
}
export interface CommunityAuthor {
  name?: string
  avatar?: string
}
const toRow = (row: components['schemas']['ExamCardDto']): CommunityRow => ({
  ...row,
  owner_id: row.ownerId as unknown as string | null,
  created_at: row.createdAt,
  question_count: row.questionCount,
  duration_minutes: row.durationMinutes,
  total_points: row.totalPoints,
  missing_keys: row.missingKeys as unknown as number | null,
})
export async function listCommunityDocs(): Promise<CommunityRow[]> {
  return (await requests.communityExamCommunity({ params: { query: { limit: 100 } } })).map(toRow)
}
export async function listCommunityAuthors(ids: string[]): Promise<Map<string, CommunityAuthor>> {
  if (!ids.length) return new Map()
  const rows: unknown = await requests.communityExamAuthors({
    params: { query: { ids: [...new Set(ids)] } },
    querySerializer: { array: { style: 'form', explode: false } },
  })
  if (!Array.isArray(rows)) throw new Error('Dữ liệu tác giả không hợp lệ.')
  return new Map(
    rows.map((row: { id: string; name?: string; avatar?: string }) => [
      row.id,
      { name: row.name || undefined, avatar: row.avatar || undefined },
    ]),
  )
}
export async function listMyPublished(page?: {
  limit: number
  offset: number
}): Promise<CommunityRow[]> {
  if (!(await currentSession())) return []
  return (await requests.myExamList({ params: { query: page } })).map(toRow)
}
export async function countMyPublished(): Promise<number> {
  if (!(await currentSession())) return 0
  const result = (await requests.myExamCount({})) as unknown as { count: number }
  if (typeof result?.count !== 'number') throw new Error('Dữ liệu số đề không hợp lệ.')
  return result.count
}
export async function getCommunityDoc(id: string): Promise<ExamDoc> {
  const result = (await requests.communityExamCommunityDoc({
    params: { path: { id } },
  })) as unknown as ExamDoc
  if (!result || !Array.isArray(result.blocks)) throw new Error('Đề này không còn được xuất bản.')
  return result
}
export async function publishDoc(
  doc: ExamDoc,
  listed = true,
  replaceId?: string,
): Promise<CommunityRow> {
  if (!(await currentSession())) throw new AuthError('Bạn cần đăng nhập để đăng đề.')
  if (!(await confirmPublishWithoutKey(docToExam(doc, doc.id))))
    throw new Error('Đã huỷ đăng đề để bổ sung đáp án.')
  const body = { doc: doc as unknown as Record<string, unknown>, listed }
  return toRow(
    replaceId
      ? await requests.myExamReplace({ params: { path: { id: replaceId } }, body })
      : await requests.myExamPublish({ body }),
  )
}
export async function setListed(id: string, listed: boolean): Promise<void> {
  await requests.myExamSetListed({ params: { path: { id } }, body: { listed } })
}
export async function unpublish(id: string): Promise<void> {
  await requests.myExamUnpublish({ params: { path: { id } } })
}
export async function getStudentDoc(id: string): Promise<ExamDoc> {
  return (await requests.communityExamPlay({ params: { path: { id } } })).doc as unknown as ExamDoc
}
export interface ReportInput {
  examId: string
  reason: string
  detail?: string
}
export async function submitReport(input: ReportInput): Promise<void> {
  await requests.examReportReport({
    params: { path: { id: input.examId } },
    body: { reason: input.reason.trim(), detail: input.detail?.trim() || undefined },
  })
}
export interface FeedbackInput {
  message: string
  email?: string
  page?: string
}
export async function submitFeedback(input: FeedbackInput): Promise<void> {
  await sendFeedback({
    message: input.message.trim(),
    email: input.email?.trim() || undefined,
    page: input.page || window.location.pathname + window.location.search,
  })
}
