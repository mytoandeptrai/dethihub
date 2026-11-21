export const USER_PROFILE_LOOKUP = Symbol('USER_PROFILE_LOOKUP')

export interface UserProfile {
  name: string | null
  avatar: string | null
}

export interface UserProfileLookupPort {
  /** Ids that cannot be resolved are left out of the map */
  getProfiles(userIds: string[]): Promise<Map<string, UserProfile>>
}
