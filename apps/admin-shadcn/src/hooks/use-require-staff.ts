'use client'

import { notFound } from 'next/navigation'

import { useMe } from '@/apis/me'

export function useRequireStaff() {
  const me = useMe()
  if (me.error) throw me.error
  if (me.isSuccess && me.data?.role !== 'admin' && me.data?.role !== 'moderator') notFound()
  return { isLoading: !me.isSuccess }
}
