'use client'
import { useRouter } from 'next/navigation'

export const FEATURE_DISABLED_MESSAGE =
  'Quản trị viên đã tạm tắt tính năng này. Nội dung bạn đã tạo vẫn xem được.'

export function FeatureNotice({
  banner = false,
  staff = false,
}: {
  banner?: boolean
  staff?: boolean
}) {
  const router = useRouter()
  if (staff)
    return (
      <div
        role="status"
        className="border-line bg-sunken text-ink-3 border-b px-4 py-2 text-xs print:hidden"
      >
        Tính năng đang tắt với người dùng
      </div>
    )
  return (
    <section
      role="status"
      className={
        banner
          ? 'border-line bg-sunken text-ink-2 border-b px-4 py-2 text-sm print:hidden'
          : 'text-ink mx-auto max-w-xl space-y-4 p-8'
      }
    >
      {!banner && <h1 className="text-xl font-semibold">Tính năng đang tạm tắt</h1>}
      <p>{FEATURE_DISABLED_MESSAGE}</p>
      {!banner && (
        <button
          type="button"
          className="text-clay rounded border px-4 py-2"
          onClick={() => router.back()}
        >
          Quay lại
        </button>
      )}
    </section>
  )
}
