/**
 * Ảnh người dùng đưa vào đi lên R2 qua server (`/api/upload`); deck chỉ giữ đường dẫn `/api/files/...`
 * thay vì base64 nặng trong localStorage. Ảnh cũ dạng data URL vẫn chạy bình thường.
 */
import { uploadImageFile } from '@/apis/storage/requests'
import { apiFetch } from '@/engine/lib/apiFetch'
import { currentSession } from '@/engine/lib/auth-session'

/** Đẩy data URL lên R2, trả về đường dẫn. Chuỗi không phải data URL thì giữ nguyên. */
export async function uploadImage(
  src: string,
  auth?: { token: string; signal: AbortSignal },
): Promise<string> {
  if (!src.startsWith('data:image/')) return src
  if (!auth && !(await currentSession())) return src
  const blob = await (await fetch(src, { signal: auth?.signal })).blob()
  const file = new File([blob], 'image.' + (blob.type.split('/')[1] || 'png'), { type: blob.type })
  const body = await uploadImageFile(file, auth?.signal)
  return body.url
}

/** Lấy ảnh về dạng data URL (để xuất PPTX/DOCX cần nhúng ảnh vào file). */
export async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  const res = await apiFetch(src)
  if (!res.ok) throw new Error(`Không đọc được ảnh (${res.status})`)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
