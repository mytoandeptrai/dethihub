import { Portal } from '@admin-overlays-engine'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AdminModal } from '@/modules/admin-pages/components/admin-primitives-ui'

describe('admin nested Escape layers', () => {
  it('closes only the upper portal before allowing the parent dialog to close', async () => {
    const close = vi.fn()
    function Surface() {
      const [open, setOpen] = useState(false),
        [child, setChild] = useState(false),
        [tool, setTool] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Open editor</button>
          {open ? (
            <AdminModal
              title="Editor"
              onClose={() => {
                close()
                setOpen(false)
              }}
            >
              <button onClick={() => setChild(true)}>Open picker</button>
              {child ? (
                <Portal onClose={() => setChild(false)}>
                  <div role="dialog" aria-label="Picker">
                    <button onClick={() => setTool(true)}>Open drawing</button>
                    {tool ? (
                      <Portal onClose={() => setTool(false)}>
                        <div role="dialog" aria-label="Drawing">
                          <button>Draw</button>
                        </div>
                      </Portal>
                    ) : null}
                  </div>
                </Portal>
              ) : null}
            </AdminModal>
          ) : null}
        </>
      )
    }
    const user = userEvent.setup()
    render(<Surface />)
    await user.click(screen.getByText('Open editor'))
    await user.click(screen.getByText('Open picker'))
    await user.click(screen.getByText('Open drawing'))
    expect(screen.getByRole('dialog', { name: 'Drawing' })).toBeVisible()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Drawing' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('dialog', { name: 'Picker' })).toBeVisible()
    expect(close).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Picker' })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Open picker')).toBeVisible()
    expect(close).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.getByText('Open editor')).toHaveFocus())
  })
})
