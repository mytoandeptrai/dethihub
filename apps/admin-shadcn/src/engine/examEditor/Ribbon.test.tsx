import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Ribbon } from './Ribbon'
import { PhoneRibbon } from './RibbonAdaptive'

import type { FormatState } from './formatState'

const format: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  sub: false,
  super: false,
  highlight: false,
  highlightColor: '',
  color: '',
  fontFamily: '',
  fontSize: '',
  align: 'left',
  dir: 'ltr',
  lineHeight: 1.5,
  indentLeft: 0,
  indentFirstLine: 0,
  spaceBefore: 0,
  spaceAfter: 0,
  borders: undefined,
  shading: '',
  blockType: null,
}

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterAll(() => vi.unstubAllGlobals())

describe('exam ribbon', () => {
  it('reveals requested mobile ribbon tabs without opening a panel initially', async () => {
    const props = {
      fileMenu: null,
      groupsByTab: {
        insert: [{ id: 'image', label: 'Ảnh', render: () => <button>Chọn ảnh</button> }],
      },
      onSave: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
      disabled: false,
      format,
      onToggleBold: vi.fn(),
      onToggleItalic: vi.fn(),
      onToggleUnderline: vi.fn(),
      penColor: '',
      onPickColor: vi.fn(),
      themeColors: [],
      onInsertTemplate: vi.fn(),
      onIndentDec: vi.fn(),
      onIndentInc: vi.fn(),
      onAlign: vi.fn(),
    }
    const view = render(<PhoneRibbon {...props} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    view.rerender(<PhoneRibbon {...props} reveal={{ tab: 'insert' }} />)
    expect(await screen.findByRole('button', { name: 'Chọn ảnh' })).toBeVisible()
  })

  it('keeps original tabs, formatting gallery and quick file actions', async () => {
    const save = vi.fn(),
      quiz = vi.fn(),
      pdf = vi.fn(),
      word = vi.fn(),
      status = vi.fn()
    render(
      <Ribbon
        editor={null}
        activeTab="home"
        onTabChange={vi.fn()}
        onNewDoc={vi.fn()}
        onImportFile={vi.fn()}
        onSave={save}
        onPrint={vi.fn()}
        onExportWord={word}
        onExportPdf={pdf}
        onStartQuiz={quiz}
        dirty={false}
        pageCount={1}
        zoom={100}
        onZoomChange={vi.fn()}
        format={format}
        fileActions={[
          { label: 'Trạng thái: Hoàn thành', hint: 'Trạng thái tài liệu', onClick: status },
        ]}
      />,
    )
    for (const label of ['Trang chủ', 'Chèn', 'Bố cục'])
      expect(screen.getByRole('tab', { name: label })).toBeVisible()
    for (const label of [
      'Bình thường',
      'Không giãn',
      'Tiêu đề',
      'Phụ đề',
      'Tiêu đề 1',
      'Tiêu đề 2',
      'Tiêu đề 3',
      'Trích dẫn',
    ])
      expect(await screen.findByText(label, { exact: true })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Lưu đề' }))
    expect(save).toHaveBeenCalledOnce()
    for (const [label, callback] of [
      ['Xuất Word', word],
      ['Xuất PDF', pdf],
      ['Làm đề tương tác', quiz],
      ['Trạng thái: Hoàn thành', status],
    ] as const) {
      await userEvent.click(screen.getByRole('button', { name: /Tệp/ }))
      await userEvent.click(await screen.findByRole('menuitem', { name: new RegExp(label) }))
      expect(callback).toHaveBeenCalledOnce()
    }
    expect(screen.queryByRole('navigation', { name: 'Công cụ soạn đề' })).not.toBeInTheDocument()
  })
})
