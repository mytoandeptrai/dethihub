import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  BankQuestionRepositoryPort,
  BankRow,
  BankStatus,
} from '@/modules/bank/application/ports/bank-question.repository.port'
import type { Prisma } from '@workspace/database'

@Injectable()
export class BankQuestionRepositoryImpl implements BankQuestionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<BankRow[]> {
    const rows = await this.prisma.bankQuestion.findMany({ orderBy: { updatedAt: 'desc' } })
    return rows.map((row) => ({
      id: row.id,
      data: row.data,
      status: row.status as BankStatus,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    }))
  }

  async save(
    id: string,
    data: Record<string, unknown>,
    status: BankStatus,
    adminId: string,
  ): Promise<void> {
    const json = data as Prisma.InputJsonObject
    await this.prisma.bankQuestion.upsert({
      where: { id },
      create: { id, data: json, status, updatedBy: adminId },
      update: { data: json, status, updatedBy: adminId },
    })
  }

  async hide(id: string, entry: Record<string, unknown>, adminId: string): Promise<void> {
    await this.prisma.bankQuestion.upsert({
      where: { id },
      create: { id, data: entry as Prisma.InputJsonObject, status: 'hidden', updatedBy: adminId },
      update: { status: 'hidden', updatedBy: adminId },
    })
  }

  async unhide(id: string, adminId: string): Promise<void> {
    await this.prisma.bankQuestion.updateMany({
      where: { id },
      data: { status: 'published', updatedBy: adminId },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.bankQuestion.deleteMany({ where: { id } })
  }
}
