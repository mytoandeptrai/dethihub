'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  lib_llm_aiPointsLeft as aiPointsLeft,
  lib_auth_getSession as getSession,
  lib_auth_signOut as signOut,
  toEngineSession,
  lib_auth_updateProfile as updateProfile,
  lib_mediaStore_uploadImage as uploadImage,
  useNavigate,
  lib_usePricingAccess_usePricingAccess as usePricingAccess,
} from '@profile-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { aiCreditEventsQuery, aiQuotaQuery } from '@/apis/ai'
import { meKeys, useMe } from '@/apis/me'
import { useSession } from '@/hooks'
import { t } from '@/i18n/translate'

import type { lib_auth_Session as Session } from '@profile-engine'
import type { components } from '@workspace/api-types'
import type { ChangeEvent } from 'react'
export type Quota = components['schemas']['QuotaDto']
export type QuotaState = Quota | null | 'loading' | 'error' | 'unlimited'
export const fmt = (n: number) => n.toLocaleString('vi-VN')
export const EVENT_LABELS: Record<string, string> = {
  welcome: t('profileCopy.m1'),
  admin: t('profileCopy.m2'),
  topup: t('profileCopy.m3'),
}
const quotaKey = () => `dethinhbien-quota:${getSession()?.user.id ?? ''}`
function cachedQuota(): QuotaState {
  try {
    return JSON.parse(localStorage.getItem(quotaKey()) ?? '"loading"') as QuotaState
  } catch {
    return 'loading'
  }
}
export function squareAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.addEventListener(
      'load',
      () => {
        const size = 256
        const side = Math.min(img.naturalWidth, img.naturalHeight)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error(t('profileCopy.m4')))
          return
        }
        ctx.drawImage(
          img,
          (img.naturalWidth - side) / 2,
          (img.naturalHeight - side) / 2,
          side,
          side,
          0,
          0,
          size,
          size,
        )
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      },
      { once: true },
    )
    img.addEventListener(
      'error',
      () => {
        URL.revokeObjectURL(url)
        reject(new Error(t('profileCopy.m5')))
      },
      { once: true },
    )
    img.src = url
  })
}
export function useProfileContainer() {
  const { session: raw, isLoading } = useSession()
  const session = toEngineSession(raw)
  if (isLoading) return { viewState: 2 as const }
  if (!session) return { viewState: 0 as const }
  return { viewState: 1 as const, session }
}
export function useProfilePageContainer({ user }: { user: Session['user'] }) {
  return { viewState: 0 as const, user }
}
export function useAdminCardContainer() {
  const query = useMe()
  const navigate = useNavigate()
  const me = query.data
  if (!me || (me.role !== 'admin' && me.role !== 'moderator')) return { viewState: 0 as const }
  return { viewState: 1 as const, me, navigate }
}
export function useIdentityCardContainer({ user }: { user: Session['user'] }) {
  const client = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [invalid, setInvalid] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const avatar = await uploadImage(await squareAvatar(file))
      await updateProfile({ avatar })
    },
    onSuccess: () => client.invalidateQueries({ queryKey: meKeys.all }),
  })
  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    mutation.reset()
    setInvalid(null)
    if (!file.type.startsWith('image/')) {
      setInvalid(t('profileCopy.m6'))
      return
    }
    mutation.mutate(file)
  }
  return {
    viewState: 0 as const,
    user,
    fileRef,
    changeAvatar,
    busy: mutation.isPending,
    error: invalid ?? mutation.error?.message ?? null,
    onSignOut: () => void signOut(),
  }
}
export const profileSchema = z.object({
  name: z.string().trim().min(1, t('profileCopy.m8')).max(40, t('profileCopy.nameTooLong')),
})
export function useEditCardContainer({ user }: { user: Session['user'] }) {
  const client = useQueryClient()
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name ?? '' },
  })
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => client.invalidateQueries({ queryKey: meKeys.all }),
  })
  const save = form.handleSubmit(async ({ name }) => {
    mutation.reset()
    setNotice(null)
    if (name === (user.name ?? '')) {
      setNotice(t('profileCopy.m9'))
      return
    }
    try {
      await mutation.mutateAsync({ name })
      setNotice(t('profileCopy.m10'))
    } catch {
      setNotice(null)
    }
  })
  return {
    viewState: 0 as const,
    user,
    save,
    form,
    busy: mutation.isPending,
    error: form.formState.errors.name?.message ?? mutation.error?.message ?? null,
    notice,
  }
}
export function useCreditCardContainer() {
  const { session, isLoading } = useSession()
  const canPay = usePricingAccess() === true
  const cached = useMemo(cachedQuota, [])
  const query = useQuery({ ...aiQuotaQuery({}), enabled: !isLoading && Boolean(session) })
  const q: QuotaState = query.data
    ? query.data.unlimited
      ? 'unlimited'
      : (query.data.quota ?? null)
    : query.isError
      ? typeof cached === 'object'
        ? cached
        : 'error'
      : cached
  useEffect(() => {
    if (query.data)
      try {
        localStorage.setItem(quotaKey(), JSON.stringify(q))
      } catch {}
  }, [query.data, q])
  const left = typeof q === 'object' && q ? aiPointsLeft({ ...q, scope: 'month' }) : 0
  const pct = Math.min(100, Math.round((left / Math.max(120, left)) * 100))
  return {
    viewState: 0 as const,
    q,
    left,
    pct,
    canPay,
    fetched: query.isPending ? 0 : query.dataUpdatedAt || 1,
  }
}
export function useCreditHistoryContainer({ refresh }: { refresh: number }) {
  const { session, isLoading } = useSession()
  const options = aiCreditEventsQuery({ params: { query: { limit: 20 } } })
  const query = useQuery({
    ...options,
    queryKey: [...options.queryKey, String(refresh)],
    enabled: !isLoading && Boolean(session) && refresh > 0,
    select: (rows) => rows.map((row) => ({ ...row, created_at: row.createdAt })),
  })
  const rows = query.isPending ? null : query.isError ? ('error' as const) : (query.data ?? [])
  return { viewState: 0 as const, rows }
}
