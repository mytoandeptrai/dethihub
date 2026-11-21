import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  ReserveImageResult,
  UserImageRepositoryPort,
} from '@/modules/storage/application/ports/user-image.repository.port'

@Injectable()
export class UserImageRepositoryImpl implements UserImageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  reserve(
    ownerId: string,
    key: string,
    size: number,
    check: (used: number, size: number) => string | null,
  ): Promise<ReserveImageResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`images:${ownerId}`}))`
      const existing = await tx.userImage.findUnique({
        where: { ownerId_key: { ownerId, key } },
        select: { key: true },
      })
      if (existing) return { created: false }

      const total = await tx.userImage.aggregate({ where: { ownerId }, _sum: { size: true } })
      const violation = check(Number(total._sum.size ?? 0), size)
      if (violation) return { violation }

      await tx.userImage.create({ data: { ownerId, key, size: BigInt(size) } })
      return { created: true }
    })
  }

  async release(ownerId: string, key: string): Promise<void> {
    await this.prisma.userImage.deleteMany({ where: { ownerId, key } })
  }
}
