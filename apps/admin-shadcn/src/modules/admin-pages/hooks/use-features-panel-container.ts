'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminSettingsGetAllQuery } from '@/apis/admin/queries'
import { adminSettingsSet } from '@/apis/admin/requests'

import type { components } from '@workspace/api-types'

export type Features = components['schemas']['SiteFeaturesDto']

export function useFeaturesPanelContainer({ role }: { role: string }) {
  const client = useQueryClient()
  const options = adminSettingsGetAllQuery({})
  const query = useQuery(options)
  const mutation = useMutation({
    mutationFn: async (features: Features) => {
      const result = await adminSettingsSet({
        params: { path: { key: 'features' } },
        body: { value: features },
      })
      if (!result) throw new Error('Không thể lưu tính năng.')
      return result
    },
    onMutate: async (features) => {
      await client.cancelQueries({ queryKey: options.queryKey })
      const previous = client.getQueryData(options.queryKey)
      client.setQueryData(options.queryKey, (current) =>
        current ? { ...current, features } : current,
      )
      return { previous }
    },
    onError: (_error, _features, context) => {
      client.setQueryData(options.queryKey, context?.previous)
      toast.error('Không thể lưu tính năng. Vui lòng thử lại.')
    },
    onSuccess: () => {
      toast.success('Đã cập nhật tính năng.')
    },
    onSettled: () => client.invalidateQueries({ queryKey: options.queryKey }),
  })
  return {
    features: query.data?.features,
    isPending: query.isPending,
    isError: query.isError,
    disabled: role !== 'admin' || mutation.isPending,
    toggle: (key: keyof Features, checked: boolean) => {
      if (role === 'admin' && query.data?.features && !mutation.isPending) {
        mutation.mutate({ ...query.data.features, [key]: checked })
      }
    },
  }
}
