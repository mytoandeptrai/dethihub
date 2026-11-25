'use client'
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

import { SiteButton } from '@/components/product-ui'
import { t } from '@/i18n/translate-admin-ops'
import { useAnnouncementPreview } from '@/modules/admin-pages/hooks/use-announcement-preview'

import type { lib_adminApi_Announcement as Announcement } from '@admin-pages-engine'
export function AnnouncementPopup({
  items,
  onPreviewClose,
}: {
  items: Announcement[]
  onPreviewClose: () => void
}) {
  const { shown, index, setPage, go, item } = useAnnouncementPreview(items)
  const touch = useRef<number | null>(null)
  if (!item) return null
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onPreviewClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-line bg-surface z-[300] flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-[10px] border p-0 sm:max-w-[480px] md:max-w-[720px]"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') go(-1)
          if (event.key === 'ArrowRight') go(1)
        }}
        onTouchStart={(event) => {
          touch.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          if (touch.current !== null) {
            const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current
            if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1)
            touch.current = null
          }
        }}
      >
        <DialogTitle className="sr-only">
          {item.title || t('adminOpsCopy.announcement')}
        </DialogTitle>
        <button
          type="button"
          onClick={onPreviewClose}
          aria-label={t('adminOpsCopy.closeAnnouncement')}
          className="bg-surface/90 text-ink-2 shadow-soft absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full"
        >
          <X className="size-4" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {item.image && (
            <Image
              unoptimized
              src={item.image}
              alt=""
              width={720}
              height={405}
              className="bg-sunken max-h-[45dvh] w-full object-contain md:max-h-[60dvh]"
            />
          )}
          {(item.title || item.text) && (
            <div className="px-5 pt-4 pb-1 sm:px-6">
              {item.title && (
                <h2 className="text-ink text-[18px] font-bold tracking-tight md:text-[22px]">
                  {item.title}
                </h2>
              )}
              {item.text && (
                <p className="text-ink-2 mt-1.5 text-[14px] leading-relaxed whitespace-pre-line md:text-[15.5px]">
                  {item.text}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
          {shown.length > 1 ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label={t('adminOpsCopy.previousAnnouncement')}
              >
                <ChevronLeft className="size-4" />
              </button>
              {shown.map((entry, i) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => setPage(i)}
                  aria-label={t('adminOpsCopy.announcementPage', {
                    index: String(i + 1),
                    count: String(shown.length),
                  })}
                  aria-current={index === i}
                  className="p-1"
                >
                  <span
                    className={
                      index === i
                        ? 'bg-clay block size-2 rounded-full'
                        : 'bg-line-2 block size-2 rounded-full'
                    }
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => go(1)}
                disabled={index === shown.length - 1}
                aria-label={t('adminOpsCopy.nextAnnouncement')}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <SiteButton variant="soft" size="sm" onClick={onPreviewClose}>
              {t('adminOpsCopy.close')}
            </SiteButton>
            {item.tryPath && (
              <SiteButton variant="clay" size="sm" onClick={onPreviewClose}>
                {t('adminOpsCopy.try')}
              </SiteButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
