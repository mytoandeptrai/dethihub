import { readFile, stat } from 'node:fs/promises'
import { join, posix, resolve } from 'node:path'

const routes = ['/', '/pricing', '/community']

export function initialScripts(html, baseUrl) {
  const files = new Set()
  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi)) {
    const url = new URL(match[2], baseUrl)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !/^\/_next\/static\/.*\.js$/.test(url.pathname)
    )
      continue
    const file = posix.normalize(decodeURIComponent(url.pathname.slice('/_next/'.length)))
    if (!file.startsWith('static/') || file.includes('\\')) throw new Error('Invalid chunk path')
    files.add(file)
  }
  if (files.size === 0) throw new Error('No first-load Next.js scripts found')
  return [...files].toSorted()
}

export function checkBudgets(sizes, budgets) {
  return routes.map((route) => {
    const bytes = sizes[route]
    const limit = budgets[route]
    if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error(`Invalid budget for ${route}`)
    if (!Number.isSafeInteger(bytes) || bytes <= 0)
      throw new Error(`Missing or invalid JS size for ${route}`)
    return { route, bytes, limit, passed: bytes <= limit }
  })
}

async function main() {
  const root = resolve(import.meta.dirname, '..')
  const baseUrl = process.env.BUNDLE_BASE_URL ?? 'http://localhost:8092'
  const budgets = JSON.parse(
    await readFile(new URL('./bundle-budget.json', import.meta.url), 'utf8'),
  )
  const sizes = {}
  for (const route of routes) {
    const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`)
    const files = initialScripts(await response.text(), baseUrl)
    const chunks = await Promise.all(files.map((file) => stat(join(root, '.next', file))))
    sizes[route] = chunks.reduce((total, chunk) => total + chunk.size, 0)
  }
  const results = checkBudgets(sizes, budgets)
  for (const { route, bytes, limit, passed } of results) {
    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${route}: ${bytes.toLocaleString('en-US')} / ${limit.toLocaleString('en-US')} bytes`,
    )
  }
  if (results.some((result) => !result.passed)) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  try {
    await main()
  } catch (error) {
    console.error(`Bundle budget failed: ${error.message}`)
    console.error(
      'Build the app and start its matching production server; see scripts/bundle-budget.md.',
    )
    process.exitCode = 1
  }
}
