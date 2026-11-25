'use client'
import { useMe } from '@/apis/me'
import { useSite } from '@/apis/site/queries'

import type { components } from '@workspace/api-types'

export type Feature = keyof components['schemas']['SiteFeaturesDto']

export function useFeatureAccess() {
  const status = useSite()
  const me = useMe()
  const isStaff = me.data?.role === 'admin' || me.data?.role === 'moderator'
  const isDisabled = (feature: Feature) => status.data?.features?.[feature] === false
  return {
    isStaff,
    isResolved: !status.isPending && !me.isLoading,
    isDisabled,
    canUse: (feature: Feature) => !isDisabled(feature) || isStaff || me.isLoading === true,
  }
}
