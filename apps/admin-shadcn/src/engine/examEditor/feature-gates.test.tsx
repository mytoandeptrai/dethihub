import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { StartTab } from '@/engine/examEditor/StartTab'
import { EditorHeader } from '@/engine/examEditor/EditorHeader'
import { useDocStore } from '@/engine/store/docs'
import { useBoards } from '@/engine/store/boards'
import { server } from '@/testing/msw/server'
import { FeatureNotice, FEATURE_DISABLED_MESSAGE } from '@/modules/feature-access/components/feature-notice'

const role = vi.hoisted(() => ({ value: 'user' }))
vi.mock('@/apis/me', () => ({ useMe: () => ({ data: { role: role.value } }) }))
beforeAll(() => vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }))
beforeEach(() => {
  role.value = 'user'
  useDocStore.setState({ myDocs: [], myDecks: [] })
  useBoards.setState({ items: [] })
})

const disabledFeatures = { word: false, slide: false, board: false, online: false }
function start(flags = disabledFeatures) {
  server.use(http.get('http://localhost:3000/api/site/status', () => HttpResponse.json({ features: flags })))
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <StartTab onNewDoc={vi.fn()} onNewSlide={vi.fn()} onNewBoard={vi.fn()} onOpenDoc={vi.fn()} />
  </QueryClientProvider>)
}

describe('feature entry points', () => {
  it('hides disabled cards without removing the existing-content section', async () => {
    const view = start()
    await waitFor(() => expect(view.container.querySelectorAll('.quick-card')).toHaveLength(0))
    expect(screen.getByText('Gần đây', { exact: true })).toBeVisible()
  })
  it('keeps enabled creation kinds visible', async () => {
    const view = start({ word: false, slide: true, board: false, online: false })
    await waitFor(() => expect(view.container.querySelectorAll('.quick-card')).toHaveLength(1))
    expect(view.container.querySelector('.quick-card')).toHaveTextContent('Slide')
  })
  it.each(['moderator', 'admin'])('keeps creation cards for %s', async (staff) => {
    role.value = staff
    let requested = false
    server.use(http.get('http://localhost:3000/api/site/status', () => { requested = true; return HttpResponse.json({ features: { word: false, slide: false, board: false, online: false } }) }))
    const view = render(<QueryClientProvider client={new QueryClient()}><StartTab onNewDoc={vi.fn()} onOpenDoc={vi.fn()} onNewSlide={vi.fn()} onNewBoard={vi.fn()} /></QueryClientProvider>)
    await waitFor(() => expect(requested).toBe(true))
    expect(view.container.querySelectorAll('.quick-card')).toHaveLength(3)
  })
  it('keeps export but removes save, status, rename and command mutations in a read-only header', () => {
    const download = vi.fn()
    render(<EditorHeader title="Đề đã lưu" dirty={false} status="draft" readOnly onRename={vi.fn()} onSave={vi.fn()} onStatusChange={vi.fn()} onCommands={vi.fn()} exports={[{ label: 'Word', onSelect: download }]} />)
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lệnh (Ctrl K)' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đổi tên: Đề đã lưu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Xuất' })).toBeEnabled()
  })
  it('shows the direct-create notice and a back action', () => {
    render(<FeatureNotice />)
    expect(screen.getByRole('heading', { name: 'Tính năng đang tạm tắt' })).toBeVisible()
    expect(screen.getByText(FEATURE_DISABLED_MESSAGE)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  })
  it('shows a subtle staff warning instead of the disabled notice', () => {
    render(<FeatureNotice banner staff />)
    expect(screen.getByRole('status')).toHaveTextContent('Tính năng đang tắt với người dùng')
    expect(screen.queryByText(FEATURE_DISABLED_MESSAGE)).not.toBeInTheDocument()
  })
})
