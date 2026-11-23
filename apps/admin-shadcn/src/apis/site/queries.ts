'use client'

import { useQuery } from '@tanstack/react-query'

import { siteKeys } from './keys'
import { getSite } from './requests'

export function useSite() {
  return useQuery({ queryKey: siteKeys.all, queryFn: getSite })
}
