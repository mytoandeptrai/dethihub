import {
  BadGatewayException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { docToExam, flatQuestions } from '@workspace/core'

import { ATTEMPT_REPOSITORY } from '@/modules/exam/application/ports/attempt.repository.port'
import { EXAM_REPOSITORY } from '@/modules/exam/application/ports/exam.repository.port'
import {
  ExamQueryService,
  examNotFound,
} from '@/modules/exam/application/services/exam-query.service'
import {
  ANON_ATTEMPTS_PER_EXAM,
  ATTEMPTS_PER_STUDENT,
  grade,
  revealOf,
} from '@/modules/exam/domain/policies/attempt-grading.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  AttemptRepositoryPort,
  AttemptRow,
  NewAttempt,
} from '@/modules/exam/application/ports/attempt.repository.port'
import type { ExamRepositoryPort } from '@/modules/exam/application/ports/exam.repository.port'
import type { AnswerKeyEntry } from '@/modules/exam/domain/policies/attempt-grading.policy'

const MIN_DEVICE_ID_LENGTH = 8
const MAX_EXAM_IDS = 100

export interface SubmitAttemptCommand {
  examId: string
  userId: string | null
  name: string
  answers: Record<string, unknown>
  seconds: number
  deviceId: string
  className: string
  seat?: number
}

export type AttemptOutcome =
  | { submitted: true; hidden: true }
  | {
      score: number
      max: number
      gradable: number
      correct: number
      key: Record<string, AnswerKeyEntry>
    }

const busy = () =>
  new ServiceUnavailableException({
    code: ErrorCode.ATTEMPT_SERVICE_BUSY,
    message: 'Máy chủ bận, em nộp lại sau ít phút.',
  })

@Injectable()
export class AttemptService {
  constructor(
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepositoryPort,
    @Inject(EXAM_REPOSITORY) private readonly exams: ExamRepositoryPort,
    private readonly examQuery: ExamQueryService,
  ) {}

  async submit(command: SubmitAttemptCommand): Promise<AttemptOutcome> {
    const row = await this.examQuery.loadPublished(command.examId)
    if (!row) throw examNotFound('Không tìm thấy đề.')

    const exam = docToExam(row.doc, command.examId)
    const device = command.deviceId.length >= MIN_DEVICE_ID_LENGTH ? command.deviceId : null
    const oneAttempt = exam.settings?.oneAttempt === true

    // Only an account is a trustworthy identity; a device id is chosen by the browser and trivially changed
    if (oneAttempt && !command.userId) {
      throw new UnauthorizedException({
        code: ErrorCode.LOGIN_REQUIRED,
        message: 'Đề này chỉ làm một lần, em cần đăng nhập để nộp bài.',
      })
    }
    if (!oneAttempt) await this.#enforceCaps(command, device)

    const reveal = revealOf(row.listed, exam.settings)
    const graded = grade(flatQuestions(exam), command.answers, reveal.fullKey)
    await this.#store(
      {
        examId: command.examId,
        userId: command.userId,
        studentName: command.name,
        score: graded.score,
        maxScore: graded.max,
        durationSeconds: command.seconds,
        deviceId: device,
        className: command.className || null,
        seatNo: command.seat ?? null,
      },
      oneAttempt,
    )

    if (!reveal.revealScore) return { submitted: true, hidden: true }
    const { score, max, gradable, correct, key } = graded
    return { score, max, gradable, correct, key }
  }

  async listForOwner(
    ownerId: string,
    examIds: string[],
    limit: number,
    afterId?: string,
  ): Promise<{ items: AttemptRow[]; nextCursor: string | null }> {
    const unique = [...new Set(examIds)]
    if (unique.length === 0 || unique.length > MAX_EXAM_IDS) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Danh sách đề không hợp lệ.',
      })
    }
    const owned = await this.exams.findOwnedIds(ownerId, unique)
    if (owned.length !== unique.length) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Bạn không có quyền xem bài làm của đề này.',
      })
    }
    const items = await this.attempts.listForExams(unique, limit, afterId)
    return { items, nextCursor: items.length === limit ? (items.at(-1)?.id ?? null) : null }
  }

  /*
   * Without a cap anyone holding the link could stuff thousands of fake students into the teacher's
   * gradebook. Name and device id are self-reported, so the main cap counts the whole exam; accounts
   * and devices get a smaller cap of their own.
   */
  async #enforceCaps(command: SubmitAttemptCommand, device: string | null): Promise<void> {
    let mine: number
    let guests: number
    try {
      ;[mine, guests] = await Promise.all([
        command.userId
          ? this.attempts.countByUser(command.examId, command.userId)
          : device
            ? this.attempts.countByGuestDevice(command.examId, device)
            : 0,
        command.userId ? 0 : this.attempts.countGuests(command.examId),
      ])
    } catch {
      throw busy()
    }
    if (mine >= ATTEMPTS_PER_STUDENT) {
      throw new HttpException(
        { code: ErrorCode.ATTEMPT_LIMIT, message: 'Em đã nộp bài này nhiều lần rồi.' },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
    if (guests >= ANON_ATTEMPTS_PER_EXAM) {
      throw new HttpException(
        {
          code: ErrorCode.LOGIN_REQUIRED,
          message: 'Đề đã nhận đủ số bài nộp không đăng nhập, em đăng nhập để nộp.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }

  async #store(attempt: NewAttempt, oneAttempt: boolean): Promise<void> {
    try {
      if (oneAttempt && attempt.userId) {
        const result = await this.attempts.insertWithLock({ ...attempt, userId: attempt.userId })
        if (result === 'duplicate') {
          throw new ConflictException({
            code: ErrorCode.ATTEMPT_ALREADY_SUBMITTED,
            message: 'Em đã nộp bài cho đề này rồi.',
          })
        }
        return
      }
      await this.attempts.insert(attempt)
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new BadGatewayException({
        code: ErrorCode.ATTEMPT_SAVE_FAILED,
        message: 'Không lưu được bài làm.',
      })
    }
  }
}
