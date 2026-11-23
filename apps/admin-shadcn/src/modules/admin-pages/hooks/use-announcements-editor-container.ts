'use client'
import {
  lib_adminApi_isAdminMock as isAdminMock,
  lib_mediaStore_uploadImage as uploadImage,
} from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { cn } from '@workspace/ui/lib/utils'
import { useRef, useState } from 'react'

import { inputClass } from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'

import type { lib_adminApi_Announcement as Announcement } from '@admin-pages-engine'
export const MAX_ITEMS = 12
export const blank = (image = ''): Announcement => ({
  id: crypto.randomUUID(),
  on: true,
  title: '',
  text: '',
  image,
  tryPath: '',
  until: null,
})
export const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
export const upload = async (file: File) => {
  const dataUrl = await readDataUrl(file)
  return isAdminMock() ? dataUrl : uploadImage(dataUrl)
}
export const errorText = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback
export function useAnnouncementsEditorContainer({
  initial,
  onNotice,
}: {
  initial: Announcement[]
  onNotice: (msg: string) => void
}) {
  const { setAnnouncements } = useAdminOperationsRequests()
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const addImagesRef = useRef<HTMLInputElement>(null)
  const patch = (id: string, change: Partial<Announcement>) =>
    setItems((list) => list.map((a) => (a.id === id ? { ...a, ...change } : a)))
  const move = (index: number, delta: number) =>
    setItems((list) => {
      const next = [...list]
      const [a] = next.splice(index, 1)
      if (!a) return list
      next.splice(index + delta, 0, a)
      return next
    })
  const addImages = async (files: File[]) => {
    if (files.length === 0) return
    if (items.length + files.length > MAX_ITEMS) {
      await dialog.alert(
        t('adminOpsCopy.m221', {
          value0: String(MAX_ITEMS),
          value1: String(MAX_ITEMS - items.length),
        }),
        { title: t('adminOpsCopy.m222') },
      )
      return
    }
    setBusy(true)
    try {
      const urls = await Promise.all(files.map((file) => upload(file)))
      setItems((list) => [...list, ...urls.map((url) => blank(url))])
    } catch (error) {
      await dialog.alert(errorText(error, t('adminOpsCopy.m223')), {
        title: t('adminOpsCopy.m224'),
      })
    } finally {
      setBusy(false)
    }
  }
  const replaceImage = async (id: string, file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      patch(id, { image: await upload(file) })
    } catch (error) {
      await dialog.alert(errorText(error, t('adminOpsCopy.m223')), {
        title: t('adminOpsCopy.m224'),
      })
    } finally {
      setBusy(false)
    }
  }
  const save = async () => {
    setSaving(true)
    try {
      await setAnnouncements(items)
      onNotice(t('adminOpsCopy.m225'))
    } catch (error) {
      await dialog.alert(errorText(error, t('adminOpsCopy.m226')), {
        title: t('adminOpsCopy.m227'),
      })
    } finally {
      setSaving(false)
    }
  }
  const fieldClass = cn(inputClass, 'w-full text-[13.5px]')
  return {
    viewState: 0 as const,
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
  }
}
