'use client'
import { dialog } from '@engine-dialogs'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@workspace/ui/lib/utils'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { inputClass } from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'
import { useDrawerExit } from '@/modules/admin-pages/hooks/use-drawer-exit'

import type {
  lib_adminApi_HealthProvider as HealthProvider,
  lib_adminApi_HealthService as HealthService,
} from '@admin-pages-engine'
const providerSchema = z.object({
  model: z.string().trim().max(100),
  endpoint: z.string().trim().max(300),
  apiKey: z.string().trim().max(500),
})
export type HealthDrawerTarget =
  | {
      name: string
      provider: HealthProvider
    }
  | {
      name: string
      service: HealthService
    }
export const field = cn(inputClass, 'mt-1 w-full font-mono text-[13px] font-normal')
export const labelClass = 'block text-[12.5px] font-medium text-ink'
export function useHealthDrawerContainer({
  target,
  onClose,
  onSaved,
}: {
  target: HealthDrawerTarget
  onClose: () => void
  onSaved: (providers: HealthProvider[], provider: string) => void
}) {
  const { close, panelClass } = useDrawerExit(onClose)
  return { viewState: 0 as const, close, panelClass, target, onSaved }
}
export function useProviderFormContainer({
  provider: p,
  onCancel,
  onSaved,
}: {
  provider: HealthProvider
  onCancel: () => void
  onSaved: (list: HealthProvider[]) => void
}) {
  const { resetAiProvider, saveAiProvider } = useAdminOperationsRequests()
  const [showKey, setShowKey] = useState(false)
  const form = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: { model: p.model, endpoint: p.endpoint, apiKey: '' },
  })
  const model = useWatch({ control: form.control, name: 'model' })
  const endpoint = useWatch({ control: form.control, name: 'endpoint' })
  const apiKey = useWatch({ control: form.control, name: 'apiKey' })
  const setModel = (value: string) => form.setValue('model', value)
  const setEndpoint = (value: string) => form.setValue('endpoint', value)
  const setApiKey = (value: string) => form.setValue('apiKey', value)
  const [busy, setBusy] = useState(false)
  const endpointChanged = endpoint.trim().replace(/\/+$/, '') !== p.endpoint
  const needKey = endpointChanged && !apiKey.trim()
  const dirty = model.trim() !== p.model || endpointChanged || !!apiKey.trim()
  const run = async (
    action: () => Promise<{
      providers: HealthProvider[]
    }>,
  ) => {
    setBusy(true)
    try {
      onSaved((await action()).providers)
    } catch (error: unknown) {
      await dialog.alert(error instanceof Error ? error.message : t('adminOpsCopy.m185'), {
        title: t('adminOpsCopy.m186'),
      })
    } finally {
      setBusy(false)
    }
  }
  const reset = async () => {
    const ok = await dialog.confirm(t('adminOpsCopy.m187', { value0: p.provider }), {
      title: t('adminOpsCopy.m188'),
      confirmLabel: t('adminOpsCopy.m188'),
    })
    if (ok) await run(() => resetAiProvider(p.provider))
  }
  const save = form.handleSubmit(
    (values) => run(() => saveAiProvider({ provider: p.provider, ...values })),
    () => dialog.alert(t('adminOpsCopy.invalidProvider'), { title: t('adminOpsCopy.m186') }),
  )
  return {
    viewState: 0 as const,
    model,
    setModel,
    p,
    endpoint,
    setEndpoint,
    apiKey,
    setApiKey,
    needKey,
    reset,
    busy,
    onCancel,
    save,
    dirty,
    showKey,
    setShowKey,
  }
}
