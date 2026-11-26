import { describe, expect, it } from 'vitest'

import { resolveSiteUrl } from './site'

describe('canonical site URL', () => {
  it('upgrades public URLs to HTTPS and uses only the origin', () => {
    expect(resolveSiteUrl('http://example.com/path')).toBe('https://example.com')
  })
  it('keeps local development HTTP', () => {
    expect(resolveSiteUrl('http://localhost:8080')).toBe('http://localhost:8080')
    expect(resolveSiteUrl('http://127.0.0.1:8080')).toBe('http://127.0.0.1:8080')
  })
  it('uses the Vercel production domain for unset or local production configuration', () => {
    expect(resolveSiteUrl(undefined, 'production', 'school.vercel.app')).toBe(
      'https://school.vercel.app',
    )
    expect(resolveSiteUrl('http://localhost:8080', 'production', 'school.vercel.app')).toBe(
      'https://school.vercel.app',
    )
  })
  it('falls back safely for absent or invalid URLs', () => {
    expect(resolveSiteUrl()).toBe('https://dethihub.vercel.app')
    expect(resolveSiteUrl('invalid')).toBe('https://dethihub.vercel.app')
    expect(resolveSiteUrl('http://localhost', 'production')).toBe('https://dethihub.vercel.app')
  })
})
