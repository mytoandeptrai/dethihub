import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageSkeleton, TableRowsSkeleton } from './page-skeleton'

describe('page loading layouts', () => {
  it.each(['cards', 'table', 'dashboard', 'form', 'detail', 'editor', 'hero'] as const)(
    'announces a busy %s layout without interactive placeholders',
    (variant) => {
      const { container } = render(<PageSkeleton variant={variant} />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('status')).toHaveAccessibleName('Đang tải')
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(5)
      expect(container.querySelectorAll('button, input, a')).toHaveLength(0)
      expect(container.querySelector('.ProseMirror')).toBeNull()
    },
  )

  it('renders the requested table dimensions and announces loading once', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowsSkeleton columns={4} rows={3} />
        </tbody>
      </table>,
    )
    expect(container.querySelectorAll('tr')).toHaveLength(3)
    expect(container.querySelectorAll('td')).toHaveLength(12)
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('renders no phantom rows for an empty skeleton', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowsSkeleton columns={4} rows={0} />
        </tbody>
      </table>,
    )
    expect(container.querySelectorAll('tr')).toHaveLength(0)
  })
})
