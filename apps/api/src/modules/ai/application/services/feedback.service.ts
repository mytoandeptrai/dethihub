import { Inject, Injectable } from '@nestjs/common'

import { FEEDBACK_REPOSITORY } from '@/modules/ai/application/ports/feedback.repository.port'

import type {
  AiFeedbackInput,
  FeedbackRepository,
} from '@/modules/ai/application/ports/feedback.repository.port'

@Injectable()
export class FeedbackService {
  constructor(@Inject(FEEDBACK_REPOSITORY) private readonly feedback: FeedbackRepository) {}

  async log(input: AiFeedbackInput): Promise<boolean> {
    try {
      await this.feedback.save({
        ...input,
        request: input.request.slice(0, 4000),
        reply: input.reply.slice(0, 8000),
        context: input.context.slice(0, 12_000),
        note: input.note.slice(0, 500),
      })
      return true
    } catch {
      return false
    }
  }
}
