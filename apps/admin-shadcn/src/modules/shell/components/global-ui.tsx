'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Wrench } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

import type { useGlobalContainer, useGlobalDialogContainer } from '@/modules/shell/hooks'
import type { ReactNode } from 'react'

type GlobalUiProps = ReturnType<typeof useGlobalContainer> & { children: ReactNode }
export function GlobalUi({
  blocked,
  maintenance,
  staff,
  message,
  announcement,
  page,
  count,
  onDismiss,
  onTry,
  onPrevious,
  onNext,
  children,
}: GlobalUiProps) {
  return (
    <>
      {maintenance && staff && (
        <div className="bg-clay px-4 py-1.5 text-center text-xs text-white">
          {t('product.staffMaintenance')}{' '}
          <Link href={appPaths.admin.ai} className="underline">
            {t('product.disableMaintenance')}
          </Link>
        </div>
      )}
      {blocked ? (
        <main
          id="main-content"
          className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center"
        >
          <Wrench className="bg-sunken size-14 rounded-xl p-3" />
          <h1 className="mt-6 text-[28px] font-semibold">{t('product.maintenance')}</h1>
          <p className="text-ink-2 mt-3 max-w-[460px] text-sm">
            {message?.trim() || t('product.maintenanceBody')}
          </p>
        </main>
      ) : (
        children
      )}
      <Dialog
        open={!!announcement}
        onOpenChange={(open) => {
          if (!open) onDismiss()
        }}
      >
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="overflow-hidden p-0"
        >
          <DialogTitle className="px-6 pt-6">
            {announcement?.title || t('product.announcement')}
          </DialogTitle>
          {announcement?.image && (
            <Image
              unoptimized
              src={announcement.image}
              alt=""
              width={1000}
              height={600}
              className="h-auto max-h-80 w-full object-contain"
            />
          )}
          <p className="px-6 text-sm whitespace-pre-line">{announcement?.text}</p>
          <div className="flex items-center justify-between gap-2 px-6 pb-6">
            <div>
              {count > 1 && (
                <>
                  <Button variant="ghost" onClick={onPrevious} disabled={page === 0}>
                    ←
                  </Button>
                  <span>
                    {page + 1}/{count}
                  </span>
                  <Button variant="ghost" onClick={onNext} disabled={page + 1 === count}>
                    →
                  </Button>
                </>
              )}
            </div>
            <Button variant="outline" onClick={onDismiss}>
              {t('product.understood')}
            </Button>
            {announcement?.tryPath && <Button onClick={onTry}>{t('product.create')}</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

type GlobalDialogUiProps = ReturnType<typeof useGlobalDialogContainer>
export function GlobalDialogUi({
  spec,
  value,
  onValue,
  onCancel,
  onAccept,
  onAlt,
}: GlobalDialogUiProps) {
  return (
    <Dialog
      open={!!spec}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent showCloseButton={false} className="z-[160] max-w-[440px]">
        <DialogTitle>{spec?.title ?? t('product.confirm')}</DialogTitle>
        <DialogDescription render={<div />}>{spec?.message}</DialogDescription>
        {spec?.kind === 'prompt' && (
          <label className="space-y-2 text-sm">
            {spec.label}
            <Input
              autoFocus
              value={value}
              placeholder={spec.placeholder}
              onChange={(event) => onValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) onAccept()
              }}
            />
          </label>
        )}
        <div className="flex justify-end gap-2">
          {spec?.kind !== 'alert' && (
            <Button variant="outline" onClick={onCancel}>
              {spec?.cancelLabel ?? t('product.cancel')}
            </Button>
          )}
          {spec?.altLabel && (
            <Button variant="outline" onClick={onAlt}>
              {spec.altLabel}
            </Button>
          )}
          <Button variant={spec?.danger ? 'destructive' : 'default'} onClick={onAccept}>
            {spec?.confirmLabel ??
              t(
                spec?.kind === 'alert'
                  ? 'product.understood'
                  : spec?.kind === 'prompt'
                    ? 'product.save'
                    : 'product.confirm',
              )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
