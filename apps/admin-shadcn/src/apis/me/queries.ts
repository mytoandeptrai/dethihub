'use client'

import { useQuery } from '@tanstack/react-query'

import { useSession } from '@/hooks'

import { meKeys } from './keys'
import { getMe } from './requests'

export function useMe() {
  const { session, isLoading } = useSession()
  return useQuery({ queryKey: meKeys.all, enabled: !isLoading && !!session, queryFn: getMe })
}
