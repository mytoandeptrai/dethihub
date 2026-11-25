import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CommunityLayout from './(community)/layout'

import type { ReactNode } from 'react'

const auth = vi.hoisted(() => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: async () => ({ auth }) }))
vi.mock('@/modules/public-pages/containers/marketing-container/marketing-container', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="marketing-shell">{children}</div>
  ),
}))
vi.mock('@/modules/shell/containers/app-shell-container/app-shell-container', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-shell">{children}</div>,
}))

beforeEach(() => vi.clearAllMocks())
describe('server-selected community shell', () => {
  it('renders the marketing shell for a guest before hydration', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    render(await CommunityLayout({ children: <h1>Community</h1> }))
    expect(screen.getByTestId('marketing-shell')).toHaveTextContent('Community')
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
    expect(auth.getUser).toHaveBeenCalledOnce()
  })
  it('keeps the app shell and public footer for an authenticated user', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'teacher' } }, error: null })
    render(await CommunityLayout({ children: <h1>Community</h1> }))
    expect(screen.getByTestId('app-shell')).toHaveTextContent('Community')
    expect(screen.queryByTestId('marketing-shell')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bảng giá' })).toBeInTheDocument()
  })
  it('keeps public content available when auth returns an error', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Unavailable') })
    render(await CommunityLayout({ children: <h1>Community</h1> }))
    expect(screen.getByTestId('marketing-shell')).toHaveTextContent('Community')
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
  })
})
