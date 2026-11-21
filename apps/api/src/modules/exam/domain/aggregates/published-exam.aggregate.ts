import { randomUUID } from 'node:crypto'

import { ExamStatus } from '@/modules/exam/domain/enums/exam-status.enum'
import { ExamRuleError } from '@/modules/exam/domain/errors/exam-rule.error'
import { ExamSummary } from '@/modules/exam/domain/value-objects/exam-summary.vo'
import { ModerationState } from '@/modules/exam/domain/value-objects/moderation-state.vo'
import { BaseAggregateRoot } from '@/shared-kernel/domain/base-aggregate-root'

import type { ExamDoc } from '@workspace/core'

export interface PublishedExamSnapshot {
  id: string
  ownerId: string | null
  doc: ExamDoc
  listed: boolean
  status: ExamStatus
  summary: ExamSummary
  moderation: ModerationState
  createdAt: Date
}

/**
 * The owner only controls content and visibility. Status and moderation fields change through
 * moderation flows, and a removed exam stays frozen as evidence.
 */
export class PublishedExam extends BaseAggregateRoot {
  readonly #id: string
  readonly #ownerId: string | null
  #doc: ExamDoc
  #listed: boolean
  readonly #status: ExamStatus
  #summary: ExamSummary
  readonly #moderation: ModerationState
  readonly #createdAt: Date

  private constructor(snapshot: PublishedExamSnapshot) {
    super()
    this.#id = snapshot.id
    this.#ownerId = snapshot.ownerId
    this.#doc = snapshot.doc
    this.#listed = snapshot.listed
    this.#status = snapshot.status
    this.#summary = snapshot.summary
    this.#moderation = snapshot.moderation
    this.#createdAt = snapshot.createdAt
  }

  static publish(ownerId: string, doc: ExamDoc, listed: boolean): PublishedExam {
    return new PublishedExam({
      id: randomUUID(),
      ownerId,
      doc,
      listed,
      status: ExamStatus.PUBLISHED,
      summary: ExamSummary.fromDoc(doc),
      moderation: ModerationState.none(),
      createdAt: new Date(),
    })
  }

  static reconstitute(snapshot: PublishedExamSnapshot): PublishedExam {
    return new PublishedExam(snapshot)
  }

  get id(): string {
    return this.#id
  }

  get ownerId(): string | null {
    return this.#ownerId
  }

  get doc(): ExamDoc {
    return this.#doc
  }

  get listed(): boolean {
    return this.#listed
  }

  get status(): ExamStatus {
    return this.#status
  }

  get summary(): ExamSummary {
    return this.#summary
  }

  get moderation(): ModerationState {
    return this.#moderation
  }

  get createdAt(): Date {
    return this.#createdAt
  }

  isRemoved(): boolean {
    return this.#status === ExamStatus.REMOVED
  }

  /** The link, student attempts and reports stay with this id */
  replaceContent(actorId: string, doc: ExamDoc, listed: boolean): void {
    this.#assertEditableBy(actorId)
    this.#doc = doc
    this.#listed = listed
    this.#summary = ExamSummary.fromDoc(doc)
  }

  setListed(actorId: string, listed: boolean): void {
    this.#assertEditableBy(actorId)
    this.#listed = listed
  }

  assertCanUnpublish(actorId: string, hasOpenReport: boolean): void {
    this.#assertEditableBy(actorId)
    if (hasOpenReport) throw new ExamRuleError('under-review')
  }

  #assertEditableBy(actorId: string): void {
    if (this.#ownerId !== actorId) throw new ExamRuleError('not-owner')
    if (this.isRemoved()) throw new ExamRuleError('removed')
  }
}
