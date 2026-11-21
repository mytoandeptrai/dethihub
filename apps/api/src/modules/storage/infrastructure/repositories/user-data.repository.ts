import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import { documentKeyFromUrl } from '@/modules/storage/domain/policies/file-key.policy'

import type { UserDataRepositoryPort } from '@/modules/storage/application/ports/user-data.repository.port'

@Injectable()
export class UserDataRepositoryImpl implements UserDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the stored document keys no remaining row points to, so the caller can delete the files */
  async purge(userId: string): Promise<string[]> {
    return this.prisma.$transaction(async (tx) => {
      const urls = [
        ...new Set(
          (await tx.userDocument.findMany({ where: { ownerId: userId }, select: { url: true } })).map(
            (row) => row.url,
          ),
        ),
      ]
      await tx.userDocument.deleteMany({ where: { ownerId: userId } })
      await tx.userImage.deleteMany({ where: { ownerId: userId } })
      await tx.userQuota.deleteMany({ where: { userId } })
      const shared = new Set(
        (await tx.userDocument.findMany({ where: { url: { in: urls } }, select: { url: true } })).map(
          (row) => row.url,
        ),
      )
      return urls.filter((url) => !shared.has(url)).flatMap((url) => documentKeyFromUrl(url) ?? [])
    })
  }
}
