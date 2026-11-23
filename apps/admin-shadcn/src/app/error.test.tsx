import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ErrorPage from '@/app/error'

describe('error page e2e', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(vi.fn())
  })
  it('calls reset on retry click', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<ErrorPage error={new Error('Test error')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('displays error message', () => {
    render(<ErrorPage error={new Error('Something broke')} reset={vi.fn()} />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
  })
})
