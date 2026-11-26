import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type MouseEvent } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { ExamCommandHost } from './ExamCommandHost'

const scroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
})
afterAll(() => {
  vi.unstubAllGlobals()
  if (scroll) Object.defineProperty(Element.prototype, 'scrollIntoView', scroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
})

describe('exam command host', () => {
  it('runs keyboard palette commands without mounting a tool rail', async () => {
    const run = vi.fn()
    render(
      <ExamCommandHost
        editor={null}
        tabs={{}}
        extra={[{ id: 'save', family: 'file', label: 'Lưu đề', group: 'Tệp', tab: 'Tệp', run }]}
        overrides={{}}
        onReveal={vi.fn()}
      >
        {() => <p>Ribbon content</p>}
      </ExamCommandHost>,
    )
    expect(screen.getByText('Ribbon content')).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Công cụ soạn đề' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Control>}k{/Control}')
    await userEvent.type(screen.getByRole('combobox'), 'Lưu đề')
    await userEvent.click(screen.getByRole('option', { name: 'Lưu đề' }))
    expect(run).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('activates a ribbon tab and reveals its mounted command control', async () => {
    const clicked = vi.fn()
    function Harness() {
      const [tab, setTab] = useState('home')
      return (
        <ExamCommandHost
          editor={null}
          tabs={{
            insert: [
              {
                id: 'media',
                label: 'Hình',
                render: () => (
                  <button
                    data-command="image"
                    title="Ảnh"
                    onClick={(event: MouseEvent) => {
                      event.preventDefault()
                      clicked()
                    }}
                  >
                    Ảnh
                  </button>
                ),
              },
            ],
          }}
          extra={[]}
          overrides={{}}
          onReveal={setTab}
        >
          {(groups) => (
            <div data-testid="ribbon" data-tab={tab}>
              {groups
                .filter((group) => group.tab === tab)
                .map((group) => (
                  <div key={group.id}>{group.content}</div>
                ))}
            </div>
          )}
        </ExamCommandHost>
      )
    }
    render(<Harness />)
    await userEvent.keyboard('{Control>}k{/Control}')
    await userEvent.type(screen.getByRole('combobox'), 'Ảnh')
    await userEvent.click(screen.getByRole('option', { name: 'Ảnh' }))
    await waitFor(() => expect(clicked).toHaveBeenCalledOnce())
    expect(screen.getByTestId('ribbon')).toHaveAttribute('data-tab', 'insert')
  })

  it('shows empty search results without executing disabled commands', async () => {
    const run = vi.fn()
    render(
      <ExamCommandHost
        editor={null}
        tabs={{}}
        extra={[
          {
            id: 'save',
            family: 'file',
            label: 'Lưu đề',
            group: 'Tệp',
            tab: 'Tệp',
            disabled: true,
            run,
          },
        ]}
        overrides={{}}
        onReveal={vi.fn()}
      >
        {() => null}
      </ExamCommandHost>,
    )
    await userEvent.keyboard('{Control>}k{/Control}')
    await userEvent.click(screen.getByRole('option', { name: 'Lưu đề' }))
    expect(run).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('combobox'), 'not-a-command')
    expect(await screen.findByText('Không tìm thấy lệnh')).toBeVisible()
  })
})
