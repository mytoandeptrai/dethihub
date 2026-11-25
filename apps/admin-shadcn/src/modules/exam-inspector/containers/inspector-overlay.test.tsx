import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

import { InspectorOverlay } from './inspector-overlay'

import type { ExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'

beforeAll(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }))
afterAll(() => vi.unstubAllGlobals())

it('renders outside measured flow and hides while the mobile sheet covers the canvas', () => {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ top: 100, left: 100, width: 200, height: 100 }) as DOMRect
  const inspector = { editor: { isDestroyed: false, view: { nodeDOM: () => element, dom: element } }, activeInspectorBlock: { id: 'block-1', pos: 0 }, revision: 1 } as unknown as ExamInspector
  const { rerender } = render(<InspectorOverlay inspector={inspector} />)
  expect(screen.getByTestId('inspector-overlay').parentElement).toBe(document.body)
  expect(screen.getByTestId('inspector-overlay')).toHaveClass('fixed', 'print:hidden')
  expect(element.childNodes).toHaveLength(0)
  rerender(<InspectorOverlay inspector={inspector} hidden />)
  expect(screen.queryByTestId('inspector-overlay')).not.toBeInTheDocument()
})
