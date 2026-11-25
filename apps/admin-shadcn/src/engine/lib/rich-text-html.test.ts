import { describe, expect, it, vi } from 'vitest'

import { containsMath, renderRichText } from './rich-text-html'

describe('rich text without a math runtime', () => {
  it.each([
    ['', ''],
    ['A < B & "C"', 'A &lt; B &amp; &quot;C&quot;'],
    ['**đậm** __gạch__ *nghiêng*', '<strong>đậm</strong> <u>gạch</u> <em>nghiêng</em>'],
    ['Giá $100', 'Giá $100'],
    ['$x$', '$x$'],
    ['![ảnh](javascript:alert(1))', '![ảnh](javascript:alert(1))'],
  ])('preserves text formatting for %s', (text, html) => {
    expect(renderRichText(text)).toBe(html)
  })

  it('keeps inline image markup and escapes its attributes', () => {
    expect(renderRichText('![Hình "A"|40](/figure.png)')).toBe(
      '<img src="/figure.png" alt="Hình &quot;A&quot;" loading="lazy" style="width:40%;height:auto;display:block;margin:6px 0;background:#fff;border-radius:6px">',
    )
  })

  it('delegates only formula tokens to the supplied renderer', () => {
    const render = vi.fn((body: string, display: boolean) => `${display}:${body}`)
    expect(renderRichText('**A** $ x $ rồi $$y\nz$$', render)).toBe(
      '<strong>A</strong> false: x  rồi true:y\nz',
    )
    expect(render.mock.calls).toEqual([
      [' x ', false],
      ['y\nz', true],
    ])
  })

  it.each([
    ['', false],
    ['**Chữ thường**', false],
    ['Giá $100', false],
    ['![Ảnh $x$](/figure.png)', false],
    ['$x$', true],
    ['$$x\ny$$', true],
    ['$x\ny$', false],
  ])('detects formulas in %s consistently', (text, expected) => {
    expect(containsMath(text)).toBe(expected)
    expect(containsMath(text)).toBe(expected)
  })
})
