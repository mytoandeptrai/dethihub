export interface ModerationStateProps {
  removedReason: string | null
  moderatedBy: string | null
  moderatedAt: Date | null
}

/** Set by moderators only; the owner never changes it */
export class ModerationState {
  readonly #props: ModerationStateProps

  private constructor(props: ModerationStateProps) {
    this.#props = props
  }

  static none(): ModerationState {
    return new ModerationState({ removedReason: null, moderatedBy: null, moderatedAt: null })
  }

  static restore(props: ModerationStateProps): ModerationState {
    return new ModerationState(props)
  }

  get removedReason(): string | null {
    return this.#props.removedReason
  }

  get moderatedBy(): string | null {
    return this.#props.moderatedBy
  }

  get moderatedAt(): Date | null {
    return this.#props.moderatedAt
  }
}
