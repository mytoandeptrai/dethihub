export type Subject =
  | 'Toán'
  | 'Ngữ văn'
  | 'Tiếng Việt'
  | 'Tiếng Anh'
  | 'Vật lí'
  | 'Hoá học'
  | 'Sinh học'
  | 'Lịch sử'
  | 'Địa lí'
  | 'Tin học'
  | 'GDKT&PL'

export type QuestionType = 'trac-nghiem' | 'dung-sai' | 'tra-loi-ngan' | 'tu-luan' | 'tu-luan-dong'

export interface Option {
  key: string
  text: string
}

export interface QuestionImage {
  src: string

  position?: 'top' | 'bottom' | 'left' | 'right'

  width?: number
  alt?: string

  plot?: string
}

export interface Question {
  srcId?: string
  id: string
  number: number
  type: QuestionType
  prompt: string

  align?: 'center' | 'right' | 'justify'
  image?: QuestionImage

  options?: Option[]

  // mcq: letter; true/false: 'Đ'/'S' per statement (e.g. 'ĐSĐS'); short answer: number (e.g. '-1,5')
  answer?: string
  explanation?: string
  points: number

  solution?: string[]

  sourceId?: string
}

export interface Section {
  id: string
  title: string
  points: number
  questions: Question[]
}

export interface ExamSettings {
  noTimeLimit?: boolean

  instantFeedback?: boolean

  shuffleQuestions?: boolean

  oneAttempt?: boolean

  showScore?: boolean

  roster?: string[]
}

export interface Exam {
  id: string
  title: string
  subject: Subject
  grade: string
  school: string
  year: string
  term: string
  durationMinutes: number

  interactive: boolean
  sections: Section[]
  author: string
  createdAt: string
  views: number
  likes: number
  shared: boolean
  cover?: string

  importedFrom?: string
  settings?: ExamSettings
}

export const SUBJECTS: Subject[] = [
  'Toán',
  'Ngữ văn',
  'Tiếng Việt',
  'Tiếng Anh',
  'Vật lí',
  'Hoá học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'GDKT&PL',
]

export const GRADES = [
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
]

export const TYPE_LABEL: Record<QuestionType, string> = {
  'trac-nghiem': 'Trắc nghiệm',
  'dung-sai': 'Đúng/Sai',
  'tra-loi-ngan': 'Trả lời ngắn',
  'tu-luan': 'Tự luận',
  'tu-luan-dong': 'Tự luận động',
}

export function totalPoints(exam: Exam): number {
  return exam.sections.reduce((sum, s) => sum + s.questions.reduce((n, q) => n + q.points, 0), 0)
}

export function questionCount(exam: Exam): number {
  return exam.sections.reduce((sum, s) => sum + s.questions.length, 0)
}

export function flatQuestions(exam: Exam): Question[] {
  return exam.sections.flatMap((s) => s.questions)
}
