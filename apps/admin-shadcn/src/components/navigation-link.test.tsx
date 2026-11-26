import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NavigationLink, { isPrivateLink } from './navigation-link'

import type NextLink from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, prefetch, ...props }: ComponentProps<typeof NextLink>) => (
    <a
      {...props}
      href={typeof href === 'string' ? href : (href.pathname ?? '')}
      data-prefetch={String(prefetch)}
    />
  ),
}))

describe('private route prefetch', () => {
  it.each([
    'editor',
    'grading',
    'online-exams',
    'my-docs',
    'library',
    'profile',
    'admin',
    'play',
    'quiz',
  ])('disables prefetch for /%s and its descendants', (route) => {
    expect(isPrivateLink(`/${route}`)).toBe(true)
    expect(isPrivateLink(`/${route}/example?q=1#details`)).toBe(true)
    expect(isPrivateLink({ pathname: `/${route}`, query: { q: '1' } })).toBe(true)
  })
  it.each([
    '/',
    '/pricing',
    '/community',
    '/exams/example',
    '/editorial',
    '',
    '#details',
    'http://[',
  ])('does not classify %s as private', (href) => expect(isPrivateLink(href)).toBe(false))
  it('overrides private prefetch without changing navigation or click handlers', () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    render(
      <NavigationLink href="/editor" prefetch onClick={onClick}>
        Open
      </NavigationLink>,
    )
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('href', '/editor')
    expect(link).toHaveAttribute('data-prefetch', 'false')
    fireEvent.click(link)
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('preserves explicit public prefetch', () => {
    render(
      <NavigationLink href="/community" prefetch>
        Browse
      </NavigationLink>,
    )
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('data-prefetch', 'true')
  })
})
