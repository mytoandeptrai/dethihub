import assert from 'node:assert/strict'
import { test } from 'node:test'

import { checkBudgets, initialScripts } from './check-bundle-size.mjs'

const base = 'http://localhost:8092'
const sizes = { '/': 100, '/pricing': 100, '/community': 100 }

test('counts unique Next.js chunks, ignoring query strings and non-script assets', () => {
  const html = `<script src="/_next/static/chunks/app.js"></script>
    <script async src='${base}/_next/static/chunks/app.js?v=2'></script>
    <script src="https://cdn.example.com/_next/static/chunks/shared.js"></script>
    <link rel="preload" href="/_next/static/chunks/prefetch.js" />
    <script src="https://analytics.example.com/tracker.js"></script>`
  assert.deepEqual(initialScripts(html, base), ['static/chunks/app.js', 'static/chunks/shared.js'])
})
test('fails closed on empty HTML', () => {
  assert.throws(() => initialScripts('<html></html>', base), /No first-load/)
})
test('rejects malformed URLs and encoded traversal paths', () => {
  assert.throws(() => initialScripts('<script src="http://["></script>', base))
  assert.throws(
    () =>
      initialScripts('<script src="/_next/static/chunks/%2F..%2F..%2Fsecret.js"></script>', base),
    /Invalid chunk path/,
  )
})
test('accepts sizes exactly at the budget', () => {
  assert.equal(
    checkBudgets(sizes, sizes).every((result) => result.passed),
    true,
  )
})
test('reports an over-budget route without hiding other results', () => {
  const results = checkBudgets({ ...sizes, '/': 101 }, sizes)
  assert.deepEqual(
    results.map((result) => result.passed),
    [false, true, true],
  )
})
test('requires a positive integer budget for every target route', () => {
  for (const limit of [undefined, 0, -1, NaN, '100']) {
    assert.throws(() => checkBudgets(sizes, { ...sizes, '/pricing': limit }), /Invalid budget/)
  }
})
test('rejects missing or invalid measurements', () => {
  assert.throws(() => checkBudgets({}, sizes), /Missing or invalid/)
  assert.throws(() => checkBudgets({ ...sizes, '/community': 0 }, sizes), /Missing or invalid/)
})
