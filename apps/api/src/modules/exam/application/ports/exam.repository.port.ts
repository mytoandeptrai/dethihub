import type { PublishedExam } from '@/modules/exam/domain/aggregates/published-exam.aggregate'
import type { ExamDoc } from '@workspace/core'

export const EXAM_REPOSITORY = Symbol('EXAM_REPOSITORY')

export interface ExamCard {
  id: string
  ownerId: string | null
  title: string
  subject: string
  grade: string
  school: string
  createdAt: Date
  questionCount: number
  durationMinutes: number
  totalPoints: number
  preview: string
  listed: boolean
  missingKeys: number | null
}

export interface PublishedRow {
  doc: ExamDoc
  listed: boolean
}

export interface ExamRepositoryPort {
  /** Only `published` exams; hidden and removed ones behave as gone */
  findPublishedRow(id: string): Promise<PublishedRow | null>
  findCommunityDoc(id: string): Promise<ExamDoc | null>
  findById(id: string): Promise<PublishedExam | null>
  save(exam: PublishedExam): Promise<void>
  delete(id: string): Promise<void>
  listCommunity(limit: number): Promise<ExamCard[]>
  listByOwner(ownerId: string, limit: number, offset: number): Promise<ExamCard[]>
  countByOwner(ownerId: string): Promise<number>
  /** Keeps the owners that currently have a listed, published exam */
  filterCommunityAuthors(ownerIds: string[]): Promise<string[]>
  /** The subset of `examIds` that belong to `ownerId` */
  findOwnedIds(ownerId: string, examIds: string[]): Promise<string[]>
}
