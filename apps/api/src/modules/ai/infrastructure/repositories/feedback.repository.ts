import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  AiFeedbackInput,
  FeedbackRepositoryPort,
} from '@/modules/ai/application/ports/feedback.repository.port'

@Injectable()
export class FeedbackRepositoryImpl implements FeedbackRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(feedback: AiFeedbackInput): Promise<void> {
    await this.prisma.aiFeedback.create({ data: feedback })
  }
}
