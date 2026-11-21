import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { ATTEMPT_REPOSITORY } from '@/modules/exam/application/ports/attempt.repository.port'
import { EXAM_REPOSITORY } from '@/modules/exam/application/ports/exam.repository.port'
import { toCommunityDoc, toStudentView } from '@/modules/exam/domain/policies/student-view.policy'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AttemptRepositoryPort } from '@/modules/exam/application/ports/attempt.repository.port'
import type {
  ExamCard,
  ExamRepositoryPort,
  PublishedRow,
} from '@/modules/exam/application/ports/exam.repository.port'
import type { StudentView } from '@/modules/exam/domain/policies/student-view.policy'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type {
  UserProfile,
  UserProfileLookupPort,
} from '@/shared-kernel/application/ports/user-profile-lookup.port'
import type { ExamDoc } from '@workspace/core'

const ROW_TTL_SECONDS = 60

export const examRowCacheKey = (examId: string) => `exam:row:${examId.toLowerCase()}`

export const examNotFound = (message: string) =>
  new NotFoundException({ code: ErrorCode.EXAM_NOT_FOUND, message })

export interface CommunityAuthor extends UserProfile {
  id: string
}

@Injectable()
export class ExamQueryService {
  readonly #loading = new Map<string, Promise<PublishedRow | null>>()

  constructor(
    @Inject(EXAM_REPOSITORY) private readonly exams: ExamRepositoryPort,
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepositoryPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    @Inject(USER_PROFILE_LOOKUP) private readonly profiles: UserProfileLookupPort,
  ) {}

  listCommunity(limit: number): Promise<ExamCard[]> {
    return this.exams.listCommunity(limit)
  }

  async communityDoc(id: string): Promise<ExamDoc> {
    const doc = await this.exams.findCommunityDoc(id)
    if (!doc) throw examNotFound('Không tìm thấy đề.')
    return toCommunityDoc(doc)
  }

  async authors(ids: string[]): Promise<CommunityAuthor[]> {
    try {
      const owners = await this.exams.filterCommunityAuthors(ids)
      const profiles = await this.profiles.getProfiles(owners)
      return [...profiles].map(([id, { name, avatar }]) => ({ id, name, avatar }))
    } catch {
      return []
    }
  }

  async play(id: string): Promise<StudentView> {
    const row = await this.loadPublished(id)
    if (!row) throw examNotFound('Đề này không còn được xuất bản.')
    return toStudentView(row.doc, id, row.listed)
  }

  async gate(
    id: string,
    userId: string | null,
    deviceId: string | null,
  ): Promise<{ listed: boolean; attempted: boolean }> {
    const row = await this.loadPublished(id)
    if (!row) throw examNotFound('Đề này không còn được xuất bản.')
    return { listed: row.listed, attempted: await this.attempts.hasAttempted(id, userId, deviceId) }
  }

  /**
   * Shared by opening and submitting: a whole class loads the same large document at once, so
   * concurrent loads share one query and the result is cached briefly. Misses are never cached.
   */
  async loadPublished(id: string): Promise<PublishedRow | null> {
    const key = examRowCacheKey(id)
    const cached = await this.cache.get<PublishedRow>(key)
    if (cached) return cached
    const pending = this.#loading.get(key)
    if (pending) return pending
    const load = this.exams
      .findPublishedRow(id)
      .then(async (row) => {
        if (row) await this.cache.set(key, row, ROW_TTL_SECONDS)
        return row
      })
      .finally(() => this.#loading.delete(key))
    this.#loading.set(key, load)
    return load
  }
}
