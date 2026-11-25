import { createOgImage } from '@/lib/og-image'
import { publicExamSummary, requirePublicExam } from '@/modules/student-exams/public-exam'

export const alt = 'Đề thi cộng đồng Đề Thi Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const summary = publicExamSummary(await requirePublicExam((await params).id))
  return createOgImage({
    title: summary.title,
    description: `${summary.subject} · ${summary.grade} · ${summary.questions.length} câu hỏi`,
  })
}
