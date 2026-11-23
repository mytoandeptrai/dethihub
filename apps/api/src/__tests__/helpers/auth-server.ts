import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

import { exportJWK, generateKeyPair, SignJWT } from 'jose'

import type { User } from '@supabase/supabase-js'
import type { ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

export async function createAuthServer(prefix: string) {
  const { privateKey, publicKey } = await generateKeyPair('ES256')
  const jwk = { ...(await exportJWK(publicKey)), kid: prefix, alg: 'ES256', use: 'sig' }
  const serviceKey = randomUUID()
  const users = new Map<string, User>()
  const unexpectedRequests: string[] = []
  let lookupUnavailable = false
  let listUnavailable = false

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (request.method === 'GET' && url.pathname === '/auth/v1/.well-known/jwks.json') {
      json(response, 200, { keys: [jwk] })
      return
    }
    if (
      request.headers.apikey !== serviceKey ||
      request.headers.authorization !== `Bearer ${serviceKey}`
    ) {
      unexpectedRequests.push(`unauthorized ${request.method} ${url.pathname}`)
      json(response, 401, { message: 'Invalid fixture service key' })
      return
    }

    if (request.method === 'GET' && url.pathname === '/auth/v1/admin/users') {
      if (listUnavailable) {
        json(response, 503, { message: 'Fixture directory unavailable' })
        return
      }
      const filter = url.searchParams.get('filter')?.toLowerCase() ?? ''
      const matches = [...users.values()].filter((user) =>
        `${user.email} ${String(user.user_metadata.display_name)}`.toLowerCase().includes(filter),
      )
      const page = Number(url.searchParams.get('page') ?? 1)
      const perPage = Number(url.searchParams.get('per_page') ?? 50)
      response.setHeader('x-total-count', matches.length)
      response.setHeader(
        'link',
        `</auth/v1/admin/users?page=${Math.max(1, Math.ceil(matches.length / perPage))}>; rel="last"`,
      )
      json(response, 200, {
        users: matches.slice((page - 1) * perPage, page * perPage),
        aud: 'authenticated',
      })
      return
    }

    const userId = /^\/auth\/v1\/admin\/users\/([^/]+)$/.exec(url.pathname)?.[1]
    if (request.method === 'GET' && userId) {
      if (lookupUnavailable) {
        json(response, 503, { message: 'Fixture lookup unavailable' })
        return
      }
      const user = users.get(userId)
      json(response, user ? 200 : 404, user ?? { message: 'User not found' })
      return
    }

    unexpectedRequests.push(`${request.method} ${url.pathname}`)
    json(response, 500, { message: 'Unexpected auth fixture request' })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  return {
    url,
    serviceKey,
    users,
    unexpectedRequests,
    addUser(name = 'User', banned = false): User {
      const user: User = {
        id: randomUUID(),
        aud: 'authenticated',
        role: 'authenticated',
        email: `${prefix}-${users.size}@example.test`,
        app_metadata: {},
        user_metadata: { display_name: `${prefix}-${name}` },
        created_at: new Date().toISOString(),
        banned_until: banned ? new Date(Date.now() + 60_000).toISOString() : undefined,
      }
      users.set(user.id, user)
      return user
    },
    token(user: User, expiresIn = 300, role = 'authenticated'): Promise<string> {
      return new SignJWT({ email: user.email, role })
        .setProtectedHeader({ alg: 'ES256', kid: prefix })
        .setSubject(user.id)
        .setIssuer(`${url}/auth/v1`)
        .setAudience('authenticated')
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
        .sign(privateKey)
    },
    failLookup(value: boolean) {
      lookupUnavailable = value
    },
    failList(value: boolean) {
      listUnavailable = value
    },
    async close(): Promise<void> {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
        server.closeAllConnections()
      })
    },
  }
}

export type AuthServer = Awaited<ReturnType<typeof createAuthServer>>
