'use client'
import { useMe } from '@/apis/me'
export type AdminSection = 'overview' | 'users' | 'content' | 'bank'
export function useAdminContainer(section: AdminSection) {
  const me = useMe().data
  return {
    section,
    me:
      me && (me.role === 'admin' || me.role === 'moderator')
        ? { userId: me.userId, role: me.role }
        : null,
  }
}
