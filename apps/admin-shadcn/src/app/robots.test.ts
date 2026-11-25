import { afterEach, describe, expect, it, vi } from 'vitest'

import { site } from '@/config/site'

import robots from './robots'

afterEach(() => vi.unstubAllEnvs())

describe('crawler rules', () => {
  it('allows public pages and blocks tools in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const result = robots()
    expect(result.rules).toMatchObject({
      allow: '/',
      disallow: expect.arrayContaining(['/admin', '/editor', '/play/', '/api/']),
    })
    expect(result.sitemap).toBe(`${site.url}/sitemap.xml`)
    expect(result.host).toBe(site.url)
  })
  it('blocks all crawling outside production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' })
  })
})
