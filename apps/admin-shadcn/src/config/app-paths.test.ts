import { describe, expect, it } from 'vitest'

import { requiresAuth, safeRedirect } from './app-paths'

describe('route access and redirects', () => {
  it.each(['/profile', '/profile/uploads', '/admin', '/admin/users'])('protects %s', (path) => {
    expect(requiresAuth(path)).toBe(true)
  })
  it.each([
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/profile/public',
    '/administrator',
  ])('keeps %s public', (path) => {
    expect(requiresAuth(path)).toBe(false)
  })
  it.each([
    null,
    '',
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    '/\n/evil.example',
  ])('rejects unsafe return paths', (path) => {
    expect(safeRedirect(path)).toBe('/')
  })
  it('keeps internal return paths and queries', () => {
    expect(safeRedirect('/profile/uploads?sort=new')).toBe('/profile/uploads?sort=new')
  })
})
