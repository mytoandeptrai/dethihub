import { FileKind } from '@/modules/storage/domain/enums/file-kind.enum'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

export const ALLOWED_TYPES: Record<string, { ext: string; kind: FileKind }> = {
  'image/png': { ext: 'png', kind: FileKind.IMAGE },
  'image/jpeg': { ext: 'jpg', kind: FileKind.IMAGE },
  'image/webp': { ext: 'webp', kind: FileKind.IMAGE },
  'image/gif': { ext: 'gif', kind: FileKind.IMAGE },
  'application/pdf': { ext: 'pdf', kind: FileKind.DOCUMENT },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    kind: FileKind.DOCUMENT,
  },
}

const KEY_PATTERN =
  /^(?:(?:img|doc)\/[a-f0-9]{40}\.(?:png|jpg|webp|gif|pdf|docx)|fig\/[a-z0-9-]{2,40}\.png)$/
const URL_PREFIX = '/api/files/'

export const maxBytesOf = (kind: FileKind): number =>
  kind === FileKind.DOCUMENT ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES

export const isServableKey = (key: string): boolean => KEY_PATTERN.test(key)

export const isDocumentKey = (key: string): boolean => key.startsWith('doc/')

export const buildKey = (kind: FileKind, hash: string, ext: string): string =>
  `${kind === FileKind.DOCUMENT ? 'doc' : 'img'}/${hash.slice(0, 40)}.${ext}`

export const urlOfKey = (key: string): string => `${URL_PREFIX}${key}`

/** Only `doc/` keys: a document row's url must never point at an image shared in an exam. */
export const documentKeyFromUrl = (url: string): string | null => {
  const key = url.startsWith(URL_PREFIX) ? url.slice(URL_PREFIX.length) : ''
  return isServableKey(key) && isDocumentKey(key) ? key : null
}
