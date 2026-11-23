import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { LoginContainer } from '@/modules/auth/login'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render'

describe('login validation', () => {
  it('shows a Supabase login error verbatim for a valid form', async () => {
    server.use(
      http.post('https://test.supabase.co/auth/v1/token', () =>
        HttpResponse.json(
          { message: 'Sai thông tin đăng nhập.', code: 'invalid_credentials' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<LoginContainer />)
    await user.type(screen.getByLabelText('Email', { exact: true }), 'teacher@example.com')
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'password123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Sai thông tin đăng nhập.')).toBeInTheDocument()
  })
  it('validates empty fields and terms without submitting', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginContainer />)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Nhập email hợp lệ.')).toBeInTheDocument()
    expect(screen.getByText('Nhập mật khẩu của bạn.')).toBeInTheDocument()
    expect(
      screen.getByText('Tick đồng ý Điều khoản sử dụng và Chính sách quyền riêng tư để tiếp tục.'),
    ).toBeInTheDocument()
  })

  it('validates on change and remembers terms acceptance', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginContainer />)
    await user.type(screen.getByLabelText('Email', { exact: true }), 'invalid')
    expect(await screen.findByText('Nhập email hợp lệ.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Email', { exact: true }))
    await user.type(screen.getByLabelText('Email', { exact: true }), 'teacher@example.com')
    await user.click(screen.getByRole('checkbox'))
    expect(localStorage.getItem('dero.terms-accepted')).toBe('1')
    await user.click(screen.getByRole('checkbox'))
    expect(localStorage.getItem('dero.terms-accepted')).toBeNull()
  })
})
