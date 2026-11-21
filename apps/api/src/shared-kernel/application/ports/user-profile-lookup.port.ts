export const USER_PROFILE_LOOKUP = Symbol('USER_PROFILE_LOOKUP')

export interface UserProfile {
  name: string | null
  avatar: string | null
}

/** Admin-only: carries the email, never expose it on public responses */
export interface UserContact extends UserProfile {
  email: string | null
}

export interface UserProfileLookupPort {
  /** Ids that cannot be resolved are left out of the map */
  getProfiles(userIds: string[]): Promise<Map<string, UserProfile>>
  /** Same as getProfiles with the email, for admin screens */
  getContacts(userIds: string[]): Promise<Map<string, UserContact>>
}
