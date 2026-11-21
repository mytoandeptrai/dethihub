export const PLATFORM_ROLES = ['moderator', 'admin'] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export function isPlatformRole(value: unknown): value is PlatformRole {
  return PLATFORM_ROLES.includes(value as PlatformRole)
}

export function satisfiesRole(actual: PlatformRole | null, required: PlatformRole): boolean {
  if (!actual) return false
  return PLATFORM_ROLES.indexOf(actual) >= PLATFORM_ROLES.indexOf(required)
}
