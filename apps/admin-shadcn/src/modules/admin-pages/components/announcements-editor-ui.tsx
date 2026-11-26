'use client'
import { components_appIcons_TrashIcon as TrashIcon } from '@admin-pages-engine'
import { cn } from '@workspace/ui/lib/utils'
import { ArrowDown, ArrowUp, Eye, ImagePlus, Plus } from 'lucide-react'
import Image from 'next/image'

import { SiteButton as Button, EmptyState, Spinner } from '@/components/product-ui'
import { t } from '@/i18n/translate-admin-ops'
import { AnnouncementPopup } from '@/modules/admin-pages/components/announcement-preview-ui'
import Switch from '@/modules/admin-pages/containers/switch-container'
import { AnnouncementsEditorModel } from '@/modules/admin-pages/hooks'
import { toDatetimeLocalString, toIsoString } from '@/modules/admin-pages/hooks/admin-utils'

import type { AnnouncementsEditorParts as Imported0 } from '@/modules/admin-pages/containers/announcements-editor-container/announcements-editor-container'
const { MAX_ITEMS, blank } = AnnouncementsEditorModel
export function AnnouncementsEditorAnnouncementsEditorUi(
  props: ReturnType<typeof AnnouncementsEditorModel.useAnnouncementsEditorContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const {
      addImagesRef,
      addImages,
      busy,
      items,
      setItems,
      replaceImage,
      patch,
      fieldClass,
      move,
      setPreviewing,
      save,
      saving,
      previewing,
    } = props
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-3 max-w-[520px] text-[12.5px]">{t('adminOpsCopy.m228')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={addImagesRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => {
                void addImages([...(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
            <Button
              variant="soft"
              size="sm"
              onClick={() => addImagesRef.current?.click()}
              disabled={busy || items.length >= MAX_ITEMS}
            >
              {busy ? <Spinner className="size-3.5" /> : <ImagePlus className="size-4" />}
              <span>{t('adminOpsCopy.m229')}</span>
            </Button>
            <Button
              variant="soft"
              size="sm"
              onClick={() => setItems((list) => [...list, blank()])}
              disabled={items.length >= MAX_ITEMS}
            >
              <Plus className="size-4" />
              <span>{t('adminOpsCopy.m230')}</span>
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState title={t('adminOpsCopy.m231')} />
        ) : (
          <div className="space-y-3">
            {items.map((a, i) => (
              <div
                key={a.id}
                className="border-line grid gap-4 rounded-[8px] border p-4 sm:grid-cols-[160px_1fr]"
              >
                <div>
                  <label className="border-line-2 bg-sunken text-ink-3 hover:text-ink flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border border-dashed transition-colors">
                    {a.image ? (
                      <Image
                        unoptimized
                        src={a.image}
                        alt=""
                        width={640}
                        height={360}
                        className="size-full object-contain"
                      />
                    ) : (
                      <ImagePlus className="size-5" />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      hidden
                      onChange={(e) => {
                        void replaceImage(a.id, e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {a.image ? (
                    <button
                      type="button"
                      onClick={() => patch(a.id, { image: '' })}
                      className="text-ink-3 hover:text-ink mt-1.5 text-[12px]"
                    >
                      {t('adminOpsCopy.m232')}
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0 space-y-2.5">
                  <input
                    value={a.title}
                    onChange={(e) => patch(a.id, { title: e.target.value.slice(0, 100) })}
                    placeholder={t('adminOpsCopy.m233')}
                    aria-label={t('adminOpsCopy.m233')}
                    className={fieldClass}
                  />
                  <textarea
                    value={a.text}
                    onChange={(e) => patch(a.id, { text: e.target.value.slice(0, 500) })}
                    rows={2}
                    placeholder={t('adminOpsCopy.m234')}
                    aria-label={t('adminOpsCopy.m234')}
                    className={cn(fieldClass, 'resize-y')}
                  />
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <label className="text-ink block text-[12.5px] font-medium">
                      {t('adminOpsCopy.m235')}
                      <input
                        value={a.tryPath}
                        onChange={(e) => patch(a.id, { tryPath: e.target.value })}
                        placeholder={t('adminOpsCopy.m236')}
                        className={cn(fieldClass, 'mt-1 font-normal')}
                      />
                    </label>
                    <label className="text-ink block text-[12.5px] font-medium">
                      {t('adminOpsCopy.m237')}
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalString(a.until)}
                        onChange={(e) => patch(a.id, { until: toIsoString(e.target.value) })}
                        className={cn(fieldClass, 'mt-1 font-normal')}
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <Switch
                      id={`ann-${a.id}`}
                      checked={a.on}
                      onChange={(on) => patch(a.id, { on })}
                      label={a.on ? t('adminOpsCopy.m238') : t('adminOpsCopy.m239')}
                    />
                    <div className="text-ink-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={t('adminOpsCopy.m240')}
                        className="hover:text-ink rounded p-1.5 disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1}
                        aria-label={t('adminOpsCopy.m241')}
                        className="hover:text-ink rounded p-1.5 disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItems((list) => list.filter((x) => x.id !== a.id))}
                        aria-label={t('adminOpsCopy.m242')}
                        className="hover:text-clay rounded p-1.5"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="soft"
            size="sm"
            onClick={() => setPreviewing(true)}
            disabled={!items.some((a) => a.on)}
          >
            <Eye className="size-4" />
            <span>{t('adminOpsCopy.m243')}</span>
          </Button>
          <Button variant="clay" size="sm" onClick={save} disabled={saving || busy}>
            {saving ? <Spinner className="size-3.5" /> : null}
            <span>{t('adminOpsCopy.m244')}</span>
          </Button>
        </div>

        {previewing ? (
          <AnnouncementPopup items={items} onPreviewClose={() => setPreviewing(false)} />
        ) : null}
      </div>
    )
  }
  return null
}
