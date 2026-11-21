export const FileKind = {
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const

export type FileKind = (typeof FileKind)[keyof typeof FileKind]
