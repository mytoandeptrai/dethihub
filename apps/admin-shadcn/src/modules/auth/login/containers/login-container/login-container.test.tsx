import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { LoginContainer } from '@/modules/auth/login'
import { renderWithProviders } from '@/testing/render'

describe('google-only login', () => {
  it('offers only Google sign-in, with no email or password form', () => {
    renderWithProviders(<LoginContainer />)
    expect(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Email', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mật khẩu', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Đăng ký/ })).not.toBeInTheDocument()
  })

  it('requires terms acceptance before Google sign-in', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginContainer />)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }))
    expect(
      await screen.findByText(
        'Tick đồng ý Điều khoản sử dụng và Chính sách quyền riêng tư để tiếp tục.',
      ),
    ).toBeInTheDocument()
  })

  it('remembers terms acceptance', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginContainer />)
    await user.click(screen.getByRole('checkbox'))
    expect(localStorage.getItem('dero.terms-accepted')).toBe('1')
    await user.click(screen.getByRole('checkbox'))
    expect(localStorage.getItem('dero.terms-accepted')).toBeNull()
  })
})
