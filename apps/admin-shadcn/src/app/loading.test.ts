import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = path.resolve('src/app')
const pages = readdirSync(root, { recursive: true })
  .filter((file) => String(file).endsWith('page.tsx'))
  .map(String)

describe('route navigation loading coverage', () => {
  it('inventories all public, user and admin pages', () => {
    expect(pages).toHaveLength(36)
  })

  it.each(pages)('%s has a layout-preserving segment fallback', (page) => {
    const segmentFallback = existsSync(path.join(root, path.dirname(page), 'loading.tsx'))
    const pageFallback = readFileSync(path.join(root, page), 'utf8').includes(
      'fallback={<PageSkeleton',
    )
    expect(segmentFallback || pageFallback).toBe(true)
  })
})
