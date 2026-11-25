/**
 * Nhịp "đang online" phía người dùng:
 * Khi đã đăng nhập và tab đang hiện (document.visibilityState === 'visible'),
 * mỗi 60 giây upsert `presence` lên Supabase REST với token người dùng.
 * Không gửi khi tab ẩn, lỗi thì im lặng.
 */
import { currentSession } from '@/engine/lib/auth'

export async function pingPresence(): Promise<void> {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  try {
    if (!(await currentSession())) return
    const { submitPresence } = await import('@/apis/presence/requests')
    await submitPresence()
  } catch {}
}

/**
 * Bật nhịp online cho phiên người dùng hiện tại; trả về hàm huỷ.
 */
export function startPresence(): () => void {
  void pingPresence()

  const timer = setInterval(() => {
    void pingPresence()
  }, 60_000)

  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void pingPresence()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  return () => {
    clearInterval(timer)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
