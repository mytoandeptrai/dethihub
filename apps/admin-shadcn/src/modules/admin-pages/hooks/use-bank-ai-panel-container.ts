'use client'
import {
  lib_bankImport_generateDrafts as generateDrafts,
  lib_questionImage_imageToSrc as imageToSrc,
  lib_bankImport_importDrafts as importDrafts,
  lib_bankImport_parseJsonDrafts as parseJsonDrafts,
} from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { useRef, useState } from 'react'

import { t as translate } from '@/i18n/translate-admin-pages'

import type {
  lib_bankImport_BankDraft as BankDraft,
  data_types_QuestionType as QuestionType,
} from '@admin-pages-engine'
import type { ReactNode } from 'react'
export const answerText = (d: BankDraft) =>
  d.type === 'tu-luan' || d.type === 'tu-luan-dong'
    ? translate('adminPagesCopy.m397')
    : d.answer || translate('adminPagesCopy.m398')
export function useBankAiPanelContainer({
  meta,
  subject,
  grade,
  type,
  drafts,
  setDrafts,
  onEdit,
  onSaveDrafts,
}: {
  meta: ReactNode
  subject: string
  grade: string
  type: QuestionType
  drafts: BankDraft[]
  setDrafts: (fn: (list: BankDraft[]) => BankDraft[]) => void
  onEdit: (d: BankDraft) => void
  onSaveDrafts: (list: BankDraft[]) => Promise<void>
}) {
  const [request, setRequest] = useState('')
  const [json, setJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [count, setCount] = useState(5)
  const [busy, setBusy] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string> | null>(null)
  const [imageStates, setImageStates] = useState<Record<string, true | string>>({})
  const uploadingImages = useRef(new Set<string>())
  const fileRef = useRef<HTMLInputElement>(null)
  const jsonFileRef = useRef<HTMLInputElement>(null)
  const imageFileRef = useRef<HTMLInputElement>(null)
  const imageDraftId = useRef<string | null>(null)
  const addDrafts = (res: { drafts: BankDraft[]; warning?: string }) => {
    setDrafts((list) => [...list, ...res.drafts])
    setWarning(res.warning ?? null)
  }
  const run = async (
    label: string,
    action: () => Promise<{
      drafts: BankDraft[]
      warning?: string
    }>,
  ) => {
    setBusy(label)
    setWarning(null)
    try {
      addDrafts(await action())
    } catch (error) {
      await dialog.alert(
        error instanceof Error ? error.message : translate('adminPagesCopy.m399'),
        { title: translate('adminPagesCopy.m25') },
      )
    } finally {
      setBusy(null)
    }
  }
  const generate = () =>
    run(translate('adminPagesCopy.m400'), async () => ({
      drafts: await generateDrafts({ request, subject, grade, type, count }),
    }))
  const pickFile = (file?: File) => {
    if (file) void run(translate('adminPagesCopy.m401'), () => importDrafts(file, setBusy))
  }
  const importJson = () => {
    setJsonError(null)
    setWarning(null)
    try {
      addDrafts(parseJsonDrafts(json))
      setJson('')
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : translate('adminPagesCopy.m402'))
    }
  }
  const setDraftImage = (id: string, src?: string) => {
    setDrafts((list) =>
      list.map((d) => (d.id === id ? { ...d, image: src ? { ...d.image, src } : undefined } : d)),
    )
  }
  const clearImageState = (id: string) => {
    setImageStates(({ [id]: _state, ...rest }) => rest)
  }
  const pickImage = async (id: string, file: File) => {
    if (uploadingImages.current.has(id) || savingIds?.has(id)) return
    uploadingImages.current.add(id)
    setImageStates((states) => ({ ...states, [id]: true }))
    try {
      const src = await imageToSrc(file)
      if (src.startsWith('data:') && src.length > 40_000)
        throw new Error(translate('adminPagesCopy.m305'))
      setDraftImage(id, src)
      clearImageState(id)
    } catch (error) {
      setImageStates((states) => ({
        ...states,
        [id]: error instanceof Error ? error.message : translate('adminPagesCopy.m306'),
      }))
    } finally {
      uploadingImages.current.delete(id)
    }
  }
  const chosen = drafts.filter((d) => d.selected)
  const saveChosen = async () => {
    setSavingIds(new Set(chosen.map((d) => d.id)))
    try {
      await onSaveDrafts(chosen)
    } finally {
      setSavingIds(null)
    }
  }
  return {
    viewState: 0 as const,
    meta,
    request,
    setRequest,
    count,
    setCount,
    generate,
    busy,
    pickFile,
    fileRef,
    json,
    setJson,
    setJsonError,
    jsonError,
    jsonFileRef,
    importJson,
    warning,
    imageFileRef,
    imageDraftId,
    pickImage,
    drafts,
    chosen,
    saveChosen,
    savingIds,
    imageStates,
    setDrafts,
    onEdit,
    clearImageState,
    setDraftImage,
  }
}
