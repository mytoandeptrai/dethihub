import { publicExamSummary } from '@/modules/student-exams/public-exam'

import type { data_docTypes_ExamDoc as ExamDoc } from '@student-engine'

export function PublicExamSummary({ doc }: { doc: ExamDoc }) {
  const summary = publicExamSummary(doc)
  return (
    <section
      className="no-print mx-auto max-w-[1180px] space-y-4 px-5 py-8"
      aria-labelledby="exam-title"
    >
      <h1 id="exam-title" className="text-3xl font-semibold tracking-tight">
        {summary.title}
      </h1>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        {Object.entries({
          'Môn': summary.subject,
          'Lớp': summary.grade,
          'Số câu': summary.questions.length,
          'Tác giả': summary.author,
        }).map(([label, value]) => (
          <div key={label}>
            <dt className="inline font-medium">{label}: </dt>
            <dd className="inline">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="inline font-medium">Ngày đăng: </dt>
          <dd className="inline">
            <time dateTime={summary.createdAt}>
              {new Date(summary.createdAt).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}
            </time>
          </dd>
        </div>
      </dl>
      <p className="max-w-3xl text-slate-600">{summary.description}</p>
      {summary.questions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Xem trước câu hỏi</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {summary.questions.slice(0, 3).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
