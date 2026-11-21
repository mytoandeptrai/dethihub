import { Inject, Injectable } from '@nestjs/common'

import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'

import type { AuthUserDirectoryPort } from '@/modules/access-control/application/ports/auth-user-directory.port'
import type {
  UserProfile,
  UserProfileLookupPort,
} from '@/shared-kernel/application/ports/user-profile-lookup.port'

@Injectable()
export class SupabaseUserProfileLookupAdapter implements UserProfileLookupPort {
  constructor(@Inject(AUTH_USER_DIRECTORY) private readonly directory: AuthUserDirectoryPort) {}

  async getProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>()
    const users = await Promise.all(
      [...new Set(userIds)].map((id) => this.directory.getUser(id).catch(() => null)),
    )
    for (const user of users) {
      if (user) profiles.set(user.id, { name: user.displayName, avatar: user.avatarUrl })
    }
    return profiles
  }
}
