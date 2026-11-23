import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'

import { RegisterContainer } from '@/modules/auth/register'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render'

it('signs up with trimmed display_name metadata and shows email confirmation', async () => {
  let submitted: Record<string, unknown> | undefined
  server.use(
    http.post('https://test.supabase.co/auth/v1/signup', async ({ request }) => {
      submitted = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ id: 'test-user', email: 'teacher@example.com', identities: [] })
    }),
  )
  const user = userEvent.setup()
  renderWithProviders(<RegisterContainer />)
  await user.type(screen.getByLabelText('Tên hiển thị'), '  Giáo viên  ')
  await user.type(screen.getByLabelText('Email', { exact: true }), 'teacher@example.com')
  await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'password123')
  await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'password123')
  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button', { name: 'Đăng ký' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Đã gửi email xác nhận.')
  expect(submitted).toMatchObject({
    email: 'teacher@example.com',
    data: { display_name: 'Giáo viên' },
  })
})
