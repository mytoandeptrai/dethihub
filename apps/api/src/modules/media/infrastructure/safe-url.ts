import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

const INTERNAL = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  INTERNAL.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  INTERNAL.addSubnet(network, prefix, 'ipv6')
}

const isInternal = (address: string): boolean => {
  const family = isIP(address)
  if (family === 0) return true
  // an IPv4 address written as ::ffff:a.b.c.d is checked as IPv4
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1]
  if (mapped) return INTERNAL.check(mapped, 'ipv4')
  return INTERNAL.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

/** A URL the server is about to fetch: https only, no credentials, and every address its name resolves to is public */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('URL must use https')
  if (url.username || url.password) throw new Error('URL must not contain credentials')
  const host = url.hostname.replaceAll(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isInternal(address))) {
    throw new Error('URL points to an internal address')
  }
  return url
}
