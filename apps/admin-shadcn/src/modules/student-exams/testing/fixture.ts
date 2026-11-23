import type { data_types_Exam as Exam } from '@student-engine'

export const studentRemoteId = '22222222-2222-4222-8222-222222222222'
export const studentExam: Exam = {
  id: 'student-example',
  title: 'Bài kiểm tra Toán lớp 10',
  subject: 'Toán',
  grade: '10',
  school: 'Trường THPT Nguyễn Du',
  year: '2025 – 2026',
  term: 'Học kỳ II',
  durationMinutes: 15,
  interactive: true,
  author: 'Giáo viên',
  createdAt: '2026-01-01T00:00:00.000Z',
  views: 0,
  likes: 0,
  shared: false,
  settings: { noTimeLimit: true, showScore: true },
  sections: [
    {
      id: 'section-one',
      title: 'PHẦN I. TRẮC NGHIỆM',
      points: 2,
      questions: [
        {
          id: 'question-one',
          number: 1,
          type: 'trac-nghiem',
          prompt: 'Một cộng một bằng bao nhiêu?',
          options: [
            { key: 'A', text: '2' },
            { key: 'B', text: '3' },
            { key: 'C', text: '4' },
            { key: 'D', text: '5' },
          ],
          answer: 'A',
          explanation: '$1 + 1 = 2$.',
          points: 1,
        },
        {
          id: 'question-two',
          number: 2,
          type: 'tra-loi-ngan',
          prompt: 'Tính $2 + 3$.',
          answer: '5',
          explanation: '$2 + 3 = 5$.',
          points: 1,
        },
      ],
    },
  ],
}
export const studentDoc = {
  id: studentRemoteId,
  title: studentExam.title,
  subject: 'Toán',
  grade: '10',
  term: 'Học kỳ II',
  schoolYear: '2025 – 2026',
  duration: '15 phút',
  unit: studentExam.school,
  authority: '',
  blocks: [],
  online: studentExam,
  createdAt: studentExam.createdAt,
  updatedAt: studentExam.createdAt,
}
