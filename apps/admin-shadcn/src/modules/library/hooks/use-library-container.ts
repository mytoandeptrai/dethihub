'use client'
import { dialog } from '@engine-dialogs'
import {
  lib_documents_deleteDocument as deleteDocument,
  lib_documents_DOC_TYPES as DOC_TYPES,
  lib_documents_openDocument as openDocument,
  data_types_SUBJECTS as SUBJECTS,
  lib_documents_uploadDocument as uploadDocument,
  lib_useSession_useSession as useSession,
} from '@library-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { storageKeys, storageListDocumentsQuery, storageUsageQuery } from '@/apis/storage'
import { useSession as useAuthSession } from '@/hooks'
import { t } from '@/i18n/translate'

import type { lib_documents_UserDocument as UserDocument } from '@library-engine'
import type { ChangeEvent, DragEvent } from 'react'
export const SAMPLE_DOCS: UserDocument[] = [
  {
    id: 'sample-1',
    name: t('libraryCopy.m434'),
    mime: 'application/pdf',
    size: 1_258_291,
    url: '',
    subject: t('libraryCopy.m219'),
    created_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'sample-2',
    name: t('libraryCopy.m435'),
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 348_160,
    url: '',
    subject: t('libraryCopy.m436'),
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'sample-3',
    name: t('libraryCopy.m437'),
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 92_160,
    url: '',
    subject: t('libraryCopy.m438'),
    created_at: '2026-10-12T09:15:00Z',
  },
  {
    id: 'sample-4',
    name: t('libraryCopy.m439'),
    mime: 'application/pdf',
    size: 4_928_307,
    url: '',
    subject: t('libraryCopy.m440'),
    created_at: '2026-10-05T16:45:00Z',
  },
]
export const TYPE_OPTIONS = [
  { value: '', label: t('libraryCopy.m441') },
  { value: 'application/pdf', label: t('libraryCopy.m442') },
  {
    value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: t('libraryCopy.m443'),
  },
]
export const SUBJECT_FILTER_OPTIONS = [
  { value: '', label: t('libraryCopy.m444') },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]
export const SUBJECT_UPLOAD_OPTIONS = [
  { value: '', label: t('libraryCopy.m445') },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
export function useLibraryContainer() {
  const session = useSession()
  return { viewState: 0 as const, session }
}
export function useSignInPromptContainer() {
  return { viewState: 0 as const }
}
export function useDocumentsContainer() {
  const { session, isLoading } = useAuthSession()
  const queryClient = useQueryClient()
  const documents = useQuery({
    ...storageListDocumentsQuery({}),
    enabled: !isLoading && Boolean(session),
    select: (rows) => rows.map((row) => ({ ...row, created_at: row.createdAt })),
  })
  const usage = useQuery({ ...storageUsageQuery({}), enabled: !isLoading && Boolean(session) })
  const docs = documents.isPending ? null : (documents.data ?? [])
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const errorMessage = operationError ?? documents.error?.message ?? usage.error?.message ?? null
  const [uploadSubject, setUploadSubject] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: storageKeys.all })
  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, uploadSubject || null),
    onSuccess: invalidate,
  })
  const deletion = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate })
  const addFiles = async (files: FileList | File[]) => {
    const list = [...files]
    if (list.length === 0) return
    setBusy(true)
    setOperationError(null)
    for (const file of list) {
      try {
        await upload.mutateAsync(file)
      } catch (error) {
        setOperationError(error instanceof Error ? error.message : t('libraryCopy.m408'))
      }
    }
    setBusy(false)
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files)
    e.target.value = ''
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (!busy && e.dataTransfer.files.length > 0) void addFiles(e.dataTransfer.files)
  }
  const remove = async (doc: UserDocument) => {
    if (
      !(await dialog.confirm(t('libraryCopy.m447', { value0: doc.name }), {
        title: t('libraryCopy.m448'),
        confirmLabel: t('libraryCopy.m8'),
        danger: true,
      }))
    )
      return
    try {
      await deletion.mutateAsync(doc.id)
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : t('libraryCopy.m449'))
    }
  }
  const hasReal = (docs ?? []).length > 0
  return {
    viewState: 0 as const,
    uploadSubject,
    setUploadSubject,
    busy,
    fileRef,
    setDragging,
    onDrop,
    dragging,
    onPick,
    error: errorMessage,
    docs,
    hasReal,
    remove,
    usage: usage.data,
  }
}
export function useDocGridContainer({
  items,
  sample,
  onDelete,
}: {
  items: UserDocument[]
  sample: boolean
  onDelete?: (doc: UserDocument) => void
}) {
  const [q, setQ] = useState('')
  const [mime, setMime] = useState('')
  const [subject, setSubject] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = items.filter(
    (d) =>
      (!mime || d.mime === mime) &&
      (!subject || d.subject === subject) &&
      (!needle || d.name.toLowerCase().includes(needle)),
  )
  const filtered = Boolean(needle || mime || subject)
  return {
    viewState: 0 as const,
    shown,
    sample,
    q,
    setQ,
    subject,
    setSubject,
    mime,
    setMime,
    filtered,
    onDelete,
  }
}
export function useDocumentCardContainer({
  doc,
  sample,
  onDelete,
}: {
  doc: UserDocument
  sample: boolean
  onDelete?: (doc: UserDocument) => void
}) {
  const kind = DOC_TYPES[doc.mime] ?? t('libraryCopy.m450')
  const open = () =>
    void openDocument(doc).catch(
      (error: unknown) =>
        void dialog.alert(error instanceof Error ? error.message : t('libraryCopy.m466')),
    )
  return { viewState: 0 as const, sample, doc, kind, onDelete, open }
}
