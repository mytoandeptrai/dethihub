import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { NavPanel } from './NavPanel'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  window.matchMedia ??= vi
    .fn()
    .mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} })
})

const props = {
  doc: { type: 'doc', content: [] },
  open: true,
  onOpenChange: vi.fn(),
  onInsertTemplate: vi.fn(),
  onGoToBlock: vi.fn(),
  onInsertPlot: vi.fn(),
  inspectorContent: <p>Inspector content</p>,
}

describe('inspector navigation', () => {
  it('adds the desktop tab and renders inspector content', () => {
    const change = vi.fn()
    render(<NavPanel {...props} currentTab="inspector" onTabChange={change} />)
    expect(screen.getByTestId('inspector-tab')).toHaveTextContent('Thuộc tính')
    expect(screen.getByText('Inspector content')).toBeVisible()
    fireEvent.click(screen.getByTestId('inspector-tab'))
    expect(change).toHaveBeenCalledWith('inspector')
  })
  it('exposes the same tab in the mobile sheet', () => {
    render(<NavPanel {...props} isMobile currentTab="inspector" />)
    expect(screen.getByTestId('inspector-tab')).toHaveTextContent('Thuộc tính')
    expect(screen.getByText('Inspector content')).toBeVisible()
  })
  it('keeps desktop templates draggable with the existing JSON payload', () => {
    render(<NavPanel {...props} currentTab="blocks" />)
    const source = screen.getByRole('button', { name: /Đầu đề hai cột/ })
    expect(source).toHaveAttribute('draggable', 'true')
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(source, { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/x-exam-block',
      expect.stringContaining('examHeader'),
    )
  })
})
