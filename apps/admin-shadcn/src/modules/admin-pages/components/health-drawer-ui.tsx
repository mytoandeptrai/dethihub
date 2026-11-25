'use client'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'
import { Eye, EyeOff, X } from 'lucide-react'

import { SiteButton as Button, Spinner } from '@/components/product-ui'
import { t } from '@/i18n/translate-admin-ops'
import { AdminDrawer } from '@/modules/admin-pages/components/admin-primitives-ui'
import { HealthDrawerModel } from '@/modules/admin-pages/hooks'

import type {
  HealthDrawerParts as Imported0,
  HealthDrawerParts as Imported1,
} from '@/modules/admin-pages/containers/health-drawer-container/health-drawer-container'
const { field, labelClass } = HealthDrawerModel
export function HealthDrawerHealthDrawerUi(
  props: ReturnType<typeof HealthDrawerModel.useHealthDrawerContainer> & {
    parts: typeof Imported0
  },
) {
  const { ProviderForm } = props.parts
  if (props.viewState === 0) {
    const { close, panelClass, target, onSaved } = props
    return (
      <AdminDrawer
        onClose={close}
        className={cn(
          'border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l shadow-2xl sm:w-[480px]',
          panelClass,
        )}
        aria-label={t('adminOpsCopy.m189', { value0: target.name })}
      >
        <div className="border-line flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-ink text-[16px] font-bold">{target.name}</h2>
          <button
            type="button"
            onClick={close}
            className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5"
            aria-label={t('adminOpsCopy.m35')}
          >
            <X className="size-5" />
          </button>
        </div>
        {'provider' in target ? (
          <ProviderForm
            provider={target.provider}
            onCancel={close}
            onSaved={(list) => (onSaved(list, target.provider.provider), close())}
          />
        ) : (
          <div className="space-y-4 p-6">
            <div className={labelClass}>
              {t('adminOpsCopy.m190')}
              <p className="bg-sunken text-ink-2 mt-1 rounded-[6px] px-3 py-2 font-mono text-[13px] font-normal break-all">
                {target.service.endpoint || t('adminOpsCopy.m191')}
              </p>
            </div>
            <div className={labelClass}>
              {t('adminOpsCopy.m192')}
              <p className="bg-sunken text-ink-2 mt-1 rounded-[6px] px-3 py-2 font-mono text-[13px] font-normal">
                {target.service.keyMask || t('adminOpsCopy.m191')}
              </p>
            </div>
            <p className="text-ink-3 text-[12.5px] leading-relaxed">{t('adminOpsCopy.m193')}</p>
          </div>
        )}
      </AdminDrawer>
    )
  }
  return null
}
export function HealthDrawerProviderFormUi(
  props: ReturnType<typeof HealthDrawerModel.useProviderFormContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const {
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
    } = props
    return (
      <>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <label className={labelClass}>
            {t('adminOpsCopy.m162')}
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={p.defaultModel}
              spellCheck={false}
              className={field}
            />
          </label>
          <label className={labelClass}>
            {t('adminOpsCopy.m190')}
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={p.defaultEndpoint}
              spellCheck={false}
              className={field}
            />
          </label>
          <label className={labelClass}>
            {t('adminOpsCopy.m192')}
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  needKey ? t('adminOpsCopy.m194') : t('adminOpsCopy.m195', { value0: p.keyMask })
                }
                autoComplete="new-password"
                className={cn(field, 'pr-10', needKey && 'border-clay')}
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                aria-label={t(showKey ? 'adminOpsCopy.hideKey' : 'adminOpsCopy.showKey')}
                aria-pressed={showKey}
                className="text-ink-3 absolute inset-y-0 right-0 grid w-10 place-items-center"
              >
                {showKey ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
              </button>
            </div>
          </label>
          <p className="text-ink-3 text-[12.5px] leading-relaxed">{t('adminOpsCopy.m196')}</p>
        </div>
        <div className="border-line flex items-center justify-between gap-2 border-t px-6 py-4">
          {p.custom ? (
            <Button variant="ghost" size="sm" onClick={() => void reset()} disabled={busy}>
              {t('adminOpsCopy.m188')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="soft" size="sm" onClick={onCancel} disabled={busy}>
              {t('adminOpsCopy.m115')}
            </Button>
            <Button
              variant="clay"
              size="sm"
              onClick={() => void save()}
              disabled={busy || !dirty || needKey}
            >
              {busy ? <Spinner className="size-3.5" /> : null}
              <span>{t('adminOpsCopy.m197')}</span>
            </Button>
          </div>
        </div>
      </>
    )
  }
  return null
}
