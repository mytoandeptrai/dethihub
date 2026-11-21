import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AiFeedbackInput,
  FeedbackRepository,
} from '@/modules/ai/application/ports/feedback.repository.port'

@Injectable()
export class FeedbackRepositoryImpl implements FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(feedback: AiFeedbackInput): Promise<void> {
    await this.prisma.aiFeedback.create({ data: feedback })
  }
}
