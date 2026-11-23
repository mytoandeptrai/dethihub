import { describe, expect, it } from 'vitest'

import { legacyRedirects, mapLegacyPath } from './legacy-paths'

describe('legacy editor navigation and permanent redirects', () => {
  it.each(legacyRedirects)('maps $source permanently to $destination', ({ source, destination, permanent }) => {
    const path = source.replace(':id', 'exam-42').replace('/:path*', '/nested/detail')
    expect(mapLegacyPath(path + '?from=test#part')).toBe(destination.replace(':id', 'exam-42').replace('/:path*', '/nested/detail') + '?from=test#part')
    expect(permanent).toBe(true)
  })
  it.each(['/admin/nguoi-dung', '/admin/noi-dung', '/admin/ngan-hang', '/admin/so-lieu', '/admin/nap-diem', '/admin/nhat-ky'])('also redirects the admin base %s', (path) => {
    expect(mapLegacyPath(path)).not.toBe(path)
  })
  it.each(['', '/preview-designs', '/admin/ai', '/editor', 'https://example.com/soan-de', '//example.com/soan-de'])('does not redirect %s', (path) => {
    expect(mapLegacyPath(path)).toBe(path)
  })
})
