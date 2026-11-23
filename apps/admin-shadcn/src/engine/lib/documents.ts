import * as requests from '@/apis/storage/requests'
import { aiCreditEvents } from '@/apis/ai/requests'
import { apiFetch } from '@/engine/lib/apiFetch'
import { AuthError, currentSession } from '@/engine/lib/auth'
import type { components } from '@workspace/api-types'

export const MAX_DOC_MB = 20
export const DOC_TYPES: Record<string, string> = { 'application/pdf': 'PDF', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX' }
export interface UserDocument { id: string; name: string; mime: string; size: number; url: string; subject: string | null; created_at: string }
const toDocument = (row: components['schemas']['DocumentResponseDto']): UserDocument => ({ ...row, created_at: row.createdAt })

export async function rest<T>(path: string, _init: { method?: string; body?: unknown; token: string; prefer?: string; signal?: AbortSignal }): Promise<T> {
  if (path.includes('my_storage')) return await requests.storageUsage({ signal: _init.signal }) as T
  if (path.startsWith('/ai_credit_events')) return (await aiCreditEvents({ params: { query: { limit: 20 } } })).map((row) => ({ ...row, created_at: row.createdAt })) as T
  throw new Error('Unsupported legacy data request: ' + path)
}
export async function listDocuments(): Promise<UserDocument[]> {
  if (!await currentSession()) return []
  return (await requests.storageListDocuments({})).map(toDocument)
}
export async function uploadDocument(file: File, subject: string | null): Promise<UserDocument> {
  if (!await currentSession()) throw new AuthError('Bạn cần đăng nhập để tải tài liệu.')
  if (!DOC_TYPES[file.type]) throw new Error('Chỉ nhận tệp PDF hoặc Word (.docx).')
  if (file.size > MAX_DOC_MB * 1024 * 1024) throw new Error(`Tệp quá lớn (tối đa ${MAX_DOC_MB} MB).`)
  const usage = await requests.storageUsage({})
  if (usage.used + file.size > usage.max) throw new Error('Tệp vượt dung lượng còn lại. Xoá bớt tệp ở trang Hồ sơ để tải tiếp.')
  return toDocument(await requests.uploadDocumentFile(file, subject ?? undefined))
}
export async function deleteDocument(id: string): Promise<void> {
  await requests.storageRemoveDocument({ params: { path: { id } } })
}

/**
 * Mở tài liệu riêng (`/api/files/doc/…`): máy chủ chỉ trả cho chủ tệp nên phải gửi kèm token —
 * tải về rồi mở bản tạm trong tab mới (PDF) hoặc lưu xuống máy (DOCX, giữ đúng tên tệp).
 * Tab được mở ngay lúc bấm để trình duyệt không chặn cửa sổ bật lên.
 */
export async function openDocument(doc: { url: string; name?: string; mime?: string }): Promise<void> {
  const isPdf = (doc.mime ?? doc.url).toLowerCase().includes('pdf')
  const tab = isPdf ? window.open('', '_blank') : null
  try {
    const res = await apiFetch(doc.url)
    if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy tệp hoặc bạn không có quyền mở.' : `Không mở được tệp (${res.status}).`)
    const blobUrl = URL.createObjectURL(await res.blob())
    if (isPdf) {
      if (tab) tab.location.href = blobUrl
      else window.open(blobUrl, '_blank', 'noopener')
    } else {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = doc.name ?? 'tai-lieu.docx'
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
