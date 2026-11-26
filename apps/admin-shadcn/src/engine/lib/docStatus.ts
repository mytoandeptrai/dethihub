export type DocStatus = 'draft' | 'published' | 'archived'

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Nháp',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
}

export function docStatus(value: unknown): DocStatus {
  return value === 'published' || value === 'archived' ? value : 'draft'
}
