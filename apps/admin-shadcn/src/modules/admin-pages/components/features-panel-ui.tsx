'use client'
import { PageSkeleton } from '@/components/page-skeleton'
import { SwitchContainer } from '@/modules/admin-pages/containers/switch-container/switch-container'

import type {
  Features,
  useFeaturesPanelContainer,
} from '@/modules/admin-pages/hooks/use-features-panel-container'

const rows: { key: keyof Features; label: string; description: string }[] = [
  { key: 'word', label: 'Soạn đề (Word)', description: 'Trình soạn đề thi dạng văn bản' },
  {
    key: 'slide',
    label: 'Soạn slide (PowerPoint)',
    description: 'Tạo slide bài giảng và trình chiếu',
  },
  {
    key: 'board',
    label: 'Bảng vẽ / ghi chú PDF',
    description: 'Vẽ tự do và ghi chú trên tài liệu PDF',
  },
  { key: 'online', label: 'Đề online', description: 'Tạo, sửa và đăng đề online' },
]

export function FeaturesPanelUi(props: ReturnType<typeof useFeaturesPanelContainer>) {
  if (props.isPending) return <PageSkeleton variant="form" />
  if (props.isError || !props.features)
    return <p role="alert">Không thể tải tính năng. Vui lòng thử lại.</p>
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-ink text-xl font-semibold">Tính năng</h1>
        <p className="text-ink-3 mt-2 text-sm">Quản lý các công cụ trong không gian làm việc.</p>
      </div>
      <div className="border-line bg-canvas divide-line divide-y rounded-xl border">
        {rows.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-ink font-medium">{label}</p>
              <p className="text-ink-3 mt-1 text-sm">{description}</p>
            </div>
            <div className="[&_label]:sr-only">
              <SwitchContainer
                id={`feature-${key}`}
                label={label}
                checked={props.features![key]}
                disabled={props.disabled}
                onChange={(checked) => props.toggle(key, checked)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="text-ink-3 space-y-2 text-sm">
        <p>Nhân viên luôn có quyền truy cập, kể cả khi tính năng bị tắt.</p>
        <p>Nội dung hiện có vẫn có thể xem khi tính năng bị tắt.</p>
      </div>
    </div>
  )
}
