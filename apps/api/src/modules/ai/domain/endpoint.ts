import { isIP } from 'node:net'

const BLOCKED_V4: [RegExp, string][] = [
  [/^0\./, '0/8'],
  [/^10\./, 'private 10/8'],
  [/^127\./, 'loopback'],
  [/^169\.254\./, 'link-local'],
  [/^172\.(1[6-9]|2\d|3[01])\./, 'private 172.16/12'],
  [/^192\.168\./, 'private 192.168/16'],
  [/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, 'CGNAT 100.64/10'],
  [/^198\.1[89]\./, 'benchmark 198.18/15'],
  [/^192\.0\.[02]\./, 'reserved 192.0.0/24, 192.0.2/24'],
  [/^198\.51\.100\./, 'documentation'],
  [/^203\.0\.113\./, 'documentation'],
  [/^(22[4-9]|2[3-5]\d)\./, 'multicast/reserved'],
]

/** URLs normalise IPv6 to lowercase short form; ::ffff:, 64:ff9b::, 2002:, 2001:0: wrap an IPv4 address */
const BLOCKED_V6 = /^(::ffff:|64:ff9b:|2002:|2001:0:|2001:db8:|f[cdf]|fe[89ab])/

/** http(s) only, and never an internal host: a misconfigured base URL must not turn the server into a bridge to the private network */
export function assertAllowedUrl(raw: string, name: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`${name} is not a valid URL`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${name} must use http or https`)
  }
  const host = url.hostname.toLowerCase().replaceAll(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error(`${name} must not point to localhost`)
  }
  if (isIP(host) === 4) {
    const blocked = BLOCKED_V4.find(([pattern]) => pattern.test(host))
    if (blocked) throw new Error(`${name} points to an internal address (${blocked[1]})`)
  }
  if (isIP(host) === 6 && (host === '::1' || host === '::' || BLOCKED_V6.test(host))) {
    throw new Error(`${name} points to an internal IPv6 address`)
  }
  return url
}

/** Admin-entered endpoints are used only for hosts listed in AI_ENDPOINT_ALLOWED_HOSTS, which no admin account can edit */
export function isAllowedEndpoint(raw: string, allowedHosts: string): boolean {
  const allowed = allowedHosts
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  try {
    return allowed.includes(new URL(raw).hostname.toLowerCase())
  } catch {
    return false
  }
}
