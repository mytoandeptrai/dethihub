import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'

import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'

import type { Env } from '@/app/config/env.schema'
import type {
  AuthUser,
  AuthUserDirectoryPort,
} from '@/modules/access-control/application/ports/auth-user-directory.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { User } from '@supabase/supabase-js'

const BAN_CACHE_TTL_SECONDS = 30

@Injectable()
export class SupabaseAuthAdminAdapter implements AuthUserDirectoryPort {
  readonly #admin

  constructor(
    config: ConfigService<Env, true>,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {
    this.#admin = createClient(
      config.get('SUPABASE_URL', { infer: true }),
      config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }),
      { auth: { persistSession: false, autoRefreshToken: false } },
    ).auth.admin
  }

  async isBanned(userId: string, options: { fresh?: boolean } = {}): Promise<boolean> {
    const key = banCacheKey(userId)
    if (!options.fresh) {
      const cached = await this.cache.get<boolean>(key)
      if (cached !== undefined) return cached
    }

    const { data, error } = await this.#admin.getUserById(userId)
    // A user that no longer exists is treated as banned so a leftover token cannot be used
    const banned = error ? this.#bannedOnMissingUser(error) : isBannedUser(data.user)
    await this.cache.set(key, banned, BAN_CACHE_TTL_SECONDS)
    return banned
  }

  async forgetBan(userId: string): Promise<void> {
    await this.cache.del(banCacheKey(userId))
  }

  async getUser(userId: string): Promise<AuthUser | null> {
    const { data, error } = await this.#admin.getUserById(userId)
    if (error) {
      if (error.status === 404) return null
      throw error
    }
    return toAuthUser(data.user)
  }

  async listUsers(page: number, perPage: number): Promise<{ users: AuthUser[]; total: number }> {
    const { data, error } = await this.#admin.listUsers({ page, perPage })
    if (error) throw error
    return {
      users: data.users.map((user) => toAuthUser(user)),
      total: data.total ?? data.users.length,
    }
  }

  async ban(userId: string, duration: string): Promise<void> {
    const { error } = await this.#admin.updateUserById(userId, { ban_duration: duration })
    if (error) throw error
  }

  async unban(userId: string): Promise<void> {
    await this.ban(userId, 'none')
    await this.forgetBan(userId)
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.#admin.deleteUser(userId)
    if (error) throw error
    await this.forgetBan(userId)
  }

  #bannedOnMissingUser(error: { status?: number }): boolean {
    if (error.status === 404) return true
    throw error
  }
}

const banCacheKey = (userId: string) => `platform:ban:${userId}`

function isBannedUser(user: User & { deleted_at?: string | null }): boolean {
  if (user.deleted_at) return true
  return Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now())
}

function toAuthUser(user: User): AuthUser {
  const meta = user.user_metadata as Record<string, string | undefined>
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: meta['display_name'] || meta['full_name'] || meta['name'] || null,
    avatarUrl: meta['avatar_url'] || null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    bannedUntil:
      user.banned_until && new Date(user.banned_until).getTime() > Date.now()
        ? user.banned_until
        : null,
  }
}
