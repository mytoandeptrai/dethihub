import { describe, expect, it } from 'vitest'

import createScope from './postcss.engine.cjs'

const rootParent = { type: 'root', name: '' }

describe('marketing stylesheet isolation', () => {
  it('scopes product utilities without raising specificity', () => {
    expect(scopeSelectors(['.hub-home', 'button'], '/project/src/styles/product.css')).toEqual([
      ':where(html[data-product-shell]) .hub-home',
      ':where(html[data-product-shell]) button',
    ])
  })
  it('keeps product tokens and dark mode restricted to the marketing/app routes', () => {
    expect(scopeSelectors([':root', '.dark'], '/project/src/styles/product.css')).toEqual([
      'html[data-product-shell]',
      'html[data-product-shell].dark',
    ])
  })
})

function scopeSelectors(
  selectors: string[],
  file = '/project/src/styles/editor.css',
  parent = rootParent,
) {
  const rule = { selectors, parent }
  createScope().OnceExit({
    source: { input: { file } },
    walkRules: (visit: (value: typeof rule) => void) => visit(rule),
  })
  return rule.selectors
}

describe('editor stylesheet isolation', () => {
  it('scopes ordinary selectors without increasing their specificity', () => {
    expect(scopeSelectors(['.slide-stage__inner', 'button'])).toEqual([
      ':where(html[data-editor-engine]) .slide-stage__inner',
      ':where(html[data-editor-engine]) button',
    ])
  })

  it('keeps root tokens restricted to the active editor route', () => {
    expect(scopeSelectors([':root', ':host', 'html.dark', 'html body'])).toEqual([
      'html[data-editor-engine]',
      'html[data-editor-engine]',
      'html[data-editor-engine].dark',
      'html[data-editor-engine] body',
    ])
  })

  it('leaves empty stylesheets, unrelated CSS and animation steps alone', () => {
    expect(scopeSelectors([])).toEqual([])
    expect(scopeSelectors(['.button'], '/project/src/styles/globals.css')).toEqual(['.button'])
    expect(scopeSelectors(['0%'], undefined, { type: 'atrule', name: 'keyframes' })).toEqual(['0%'])
  })
})
