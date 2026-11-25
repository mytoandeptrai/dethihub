/**
 * Chặn lỗi trong một trang để không sập cả web thành màn trắng.
 * Hiện thông báo kèm nút tải lại; đổi trang (khoá `resetKey`) thì thử dựng lại.
 */
import { Component, type ReactNode } from 'react'

import { isChunkError } from '@/engine/lib/lazyPage'

interface Props {
  children: ReactNode
  resetKey?: string
  compact?: boolean
}
interface State {
  error: unknown
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown) {
    console.error('[PageErrorBoundary]', error)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const chunk = isChunkError(error)
    return (
      <div
        className={`flex h-full items-center justify-center px-6 text-center ${this.props.compact ? 'py-10' : 'min-h-[50vh]'}`}
      >
        <div className="max-w-[420px]">
          <p className="font-display text-ink text-[18px] font-semibold">
            {chunk ? 'Web vừa có bản cập nhật' : 'Phần này gặp lỗi'}
          </p>
          <p className="text-ink-3 mt-2 text-[13.5px] leading-relaxed">
            {chunk
              ? 'Trang đang mở là bản cũ nên không tải được phần mới. Tải lại trang để dùng bản mới nhất.'
              : 'Đã có lỗi khi hiển thị. Tải lại trang thường sẽ hết; nội dung đã lưu không bị mất.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-clay h-9 rounded-[8px] px-4 text-[13.5px] font-medium text-white hover:opacity-90"
            >
              Tải lại trang
            </button>
            {!chunk ? (
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                className="border-line text-ink hover:bg-sunken h-9 rounded-[8px] border px-4 text-[13.5px]"
              >
                Thử lại
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}
