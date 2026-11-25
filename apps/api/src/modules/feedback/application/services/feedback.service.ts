import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'

import { FEEDBACK_REPOSITORY } from '@/modules/feedback/application/ports/feedback.repository.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  FeedbackRepositoryPort,
  NewFeedback,
} from '@/modules/feedback/application/ports/feedback.repository.port'

const USER_PER_HOUR = 10
const GUEST_PER_HOUR = 60

const LIMIT_MESSAGE = {
  'busy': 'Bạn gửi quá nhanh, thử lại sau giây lát.',
  'user-limit': 'Bạn gửi góp ý nhiều quá, thử lại sau ít phút.',
  'guest-limit': 'Hệ thống đang nhận nhiều góp ý, thử lại sau.',
} as const

@Injectable()
export class FeedbackService {
  constructor(@Inject(FEEDBACK_REPOSITORY) private readonly feedback: FeedbackRepositoryPort) {}

  async submit(feedback: NewFeedback): Promise<void> {
    const outcome = await this.feedback.insertWithinLimit(feedback, USER_PER_HOUR, GUEST_PER_HOUR)
    if (outcome === 'ok') return
    throw new HttpException(
      { code: ErrorCode.QUOTA_EXCEEDED, message: LIMIT_MESSAGE[outcome] },
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }
}
