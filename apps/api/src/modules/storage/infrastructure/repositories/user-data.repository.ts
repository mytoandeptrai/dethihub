import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { documentKeyFromUrl } from '@/modules/storage/domain/policies/file-key.policy'

import type {
  PurgedKeys,
  UserDataRepositoryPort,
} from '@/modules/storage/application/ports/user-data.repository.port'

@Injectable()
export class UserDataRepositoryImpl implements UserDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** Image keys are content hashes, so several owners can share one object: only unshared keys are returned */
  async purge(userId: string): Promise<PurgedKeys> {
    return this.prisma.$transaction(async (tx) => {
      const urls = [
        ...new Set(
          (
            await tx.userDocument.findMany({ where: { ownerId: userId }, select: { url: true } })
          ).map((row) => row.url),
        ),
      ]
      await tx.userDocument.deleteMany({ where: { ownerId: userId } })
      const images = (
        await tx.userImage.findMany({ where: { ownerId: userId }, select: { key: true } })
      ).map((row) => row.key)
      await tx.userImage.deleteMany({ where: { ownerId: userId } })
      await tx.userQuota.deleteMany({ where: { userId } })
      const shared = new Set(
        (
          await tx.userDocument.findMany({ where: { url: { in: urls } }, select: { url: true } })
        ).map((row) => row.url),
      )
      const sharedImages = new Set(
        (
          await tx.userImage.findMany({ where: { key: { in: images } }, select: { key: true } })
        ).map((row) => row.key),
      )
      return {
        documentKeys: urls
          .filter((url) => !shared.has(url))
          .flatMap((url) => documentKeyFromUrl(url) ?? []),
        imageKeys: images.filter((key) => !sharedImages.has(key)),
      }
    })
  }
}
