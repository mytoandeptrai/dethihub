import { ApiProperty } from '@nestjs/swagger'

import type { ExamCard } from '@/modules/exam/application/ports/exam.repository.port'
import type { PublishedExam } from '@/modules/exam/domain/aggregates/published-exam.aggregate'

export class ExamCardDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ nullable: true })
  ownerId!: string | null

  @ApiProperty()
  title!: string

  @ApiProperty()
  subject!: string

  @ApiProperty()
  grade!: string

  @ApiProperty()
  school!: string

  @ApiProperty()
  createdAt!: string

  @ApiProperty()
  questionCount!: number

  @ApiProperty()
  durationMinutes!: number

  @ApiProperty()
  totalPoints!: number

  @ApiProperty()
  preview!: string

  @ApiProperty()
  listed!: boolean

  @ApiProperty({ nullable: true, description: 'Auto-gradable questions without an answer key' })
  missingKeys!: number | null

  static from(card: ExamCard): ExamCardDto {
    return Object.assign(new ExamCardDto(), { ...card, createdAt: card.createdAt.toISOString() })
  }

  static fromExam(exam: PublishedExam): ExamCardDto {
    const { summary } = exam
    return ExamCardDto.from({
      id: exam.id,
      ownerId: exam.ownerId,
      title: summary.title,
      subject: summary.subject,
      grade: summary.grade,
      school: summary.school,
      createdAt: exam.createdAt,
      questionCount: summary.questionCount,
      durationMinutes: summary.durationMinutes,
      totalPoints: summary.totalPoints,
      preview: summary.preview,
      listed: exam.listed,
      missingKeys: summary.missingKeys,
    })
  }
}
