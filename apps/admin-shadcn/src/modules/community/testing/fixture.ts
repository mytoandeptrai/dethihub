import { studentDoc } from '@/modules/student-exams/testing/fixture'

import type { ExamDoc } from '@community-engine'
import type { components } from '@workspace/api-types'

export const communityFixtureId = '55555555-5555-4555-8555-555555555555'
export const communityFixtureOwner = '44444444-4444-4444-8444-444444444444'
export const communityFixtureDoc: ExamDoc = {
  ...studentDoc,
  id: 'phase3e-local-document',
  title: 'Đề chia sẻ Toán lớp 10',
  online: undefined,
  blocks: [{ type: 'question', no: 1, kind: 'short', text: 'Tính $1+1$.', options: [] }],
}
export const communityFixtureCard = {
  id: communityFixtureId,
  ownerId: communityFixtureOwner,
  title: communityFixtureDoc.title,
  subject: 'Toán',
  grade: '10',
  school: communityFixtureDoc.unit,
  createdAt: '2026-01-01T00:00:00Z',
  questionCount: 1,
  durationMinutes: 15,
  totalPoints: 1,
  preview: 'Tính $1+1$.',
  listed: true,
  missingKeys: 1,
}
export const libraryFixtureFile: components['schemas']['DocumentResponseDto'] = {
  id: 'phase3e-file',
  name: 'Tài liệu Toán thử nghiệm.pdf',
  mime: 'application/pdf',
  size: 123,
  url: '/api/files/doc/phase3e-file',
  subject: 'Toán',
  createdAt: '2026-01-01T00:00:00Z',
}
export const userPagesFixtureUsage: components['schemas']['StorageUsageResponseDto'] = {
  used: 123,
  max: 20 * 1024 * 1024,
  kinds: { doc: { count: 1, bytes: 123, limit: 20 }, files: { count: 1, bytes: 123, limit: 20 } },
}
