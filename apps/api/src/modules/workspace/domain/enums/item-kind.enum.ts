export const ItemKind = {
  DOC: 'doc',
  DECK: 'deck',
  BOARD: 'board',
  ONLINE: 'online',
  UPLOAD: 'upload',
} as const

export type ItemKind = (typeof ItemKind)[keyof typeof ItemKind]
