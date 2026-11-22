export const MAX_DOC_BYTES = 2 * 1024 * 1024
export const MAX_EXAMS_PER_OWNER = 300

export const isDocTooLarge = (doc: unknown): boolean =>
  Buffer.byteLength(JSON.stringify(doc)) > MAX_DOC_BYTES

/** Counts exams in every state; only a brand-new exam is checked, replacing one is not */
export const isOwnerAtLimit = (ownedCount: number): boolean => ownedCount >= MAX_EXAMS_PER_OWNER
