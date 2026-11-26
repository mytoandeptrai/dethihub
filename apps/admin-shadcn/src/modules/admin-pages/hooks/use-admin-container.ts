'use client'
import { useMe } from '@/apis/me'
export type AdminSection =
  | 'overview'
  | 'users'
  | 'content'
  | 'bank'
  | 'stats'
  | 'payments'
  | 'ai'
  | 'audit'
  | 'features'
export function useAdminContainer(section: AdminSection) {
  const query = useMe()
  const me = query.data
  return {
    section,
    isPending: query.isPending,
    me:
      me && (me.role === 'admin' || me.role === 'moderator')
        ? { userId: me.userId, role: me.role }
        : null,
  }
}
