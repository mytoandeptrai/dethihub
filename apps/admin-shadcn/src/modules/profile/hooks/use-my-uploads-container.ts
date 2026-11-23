'use client'
import { dialog } from '@engine-dialogs'
import {
  lib_documents_deleteDocument as deleteDocument,
  lib_documents_DOC_TYPES as DOC_TYPES,
  store_docs_docSize as docSize,
  lib_documents_openDocument as openDocument,
  toEngineSession,
  lib_documents_uploadDocument as uploadDocument,
  store_boards_useBoards as useBoards,
  store_compose_useComposeStore as useComposeStore,
  store_docs_useDocStore as useDocStore,
  useNavigate,
  store_syncStatus_useSyncStatus as useSyncStatus,
} from '@profile-engine'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { storageKeys, storageListDocumentsQuery, storageUsageQuery } from '@/apis/storage'
import { appPaths } from '@/config/app-paths'
import { useSession as useAuthSession } from '@/hooks'
import { t } from '@/i18n/translate'

import type { ChangeEvent } from 'react'
export const mb = (n: number) => {
  const v = n / 1_048_576
  return `${v < 0.1 && n > 0 ? '<0,1' : v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
}
export const KIND_LABEL: [string, string][] = [
  ['doc', t('profileCopy.m45')],
  ['deck', 'Slide'],
  ['board', t('profileCopy.m46')],
  ['online', t('profileCopy.m47')],
  ['files', t('profileCopy.m48')],
  ['upload', t('profileCopy.m49')],
]
export type Kind = 'exam' | 'slide' | 'board' | 'file'
export type Item = {
  id: string
  title: string
  kind: Kind
  updatedAt: string
  size: number
  url?: string
  mime?: string
  pending?:
    | 'uploading'
    | 'waiting'
    | {
        error: string
      }
}
export const KIND_PATH: Record<Kind, string> = {
  exam: t('profileCopy.m45'),
  slide: t('profileCopy.m51'),
  board: t('profileCopy.m46'),
  file: t('profileCopy.m48'),
}
export const PER_PAGE = 8
export type Filter = 'all' | 'exam' | 'slide' | 'board' | 'file'
export function useMyUploadsContainer() {
  const { session: raw, isLoading } = useAuthSession()
  const session = toEngineSession(raw)
  if (isLoading) return { viewState: 2 as const }
  if (!session) return { viewState: 0 as const }
  return { viewState: 1 as const }
}
export function useStorageBarContainer() {
  const quota = useSyncStatus((s) => s.quota)
  const version = useSyncStatus((s) => s.version)
  const { session, isLoading } = useAuthSession()
  const options = storageUsageQuery({})
  const usage = useQuery({
    ...options,
    queryKey: [...options.queryKey, String(quota), String(version)],
    enabled: !isLoading && Boolean(session),
  })
  const st = usage.isPending ? 'loading' : usage.isError ? 'error' : usage.data
  const pct =
    typeof st === 'object' && st.max > 0 ? Math.min(100, Math.round((st.used / st.max) * 100)) : 0
  return { viewState: 0 as const, st, pct, quota }
}
export function useMyFilesCardContainer() {
  const navigate = useNavigate()
  const myDocs = useDocStore((s) => s.myDocs)
  const myDecks = useDocStore((s) => s.myDecks)
  const boards = useBoards((s) => s.items)
  const client = useQueryClient()
  const { session, isLoading } = useAuthSession()
  const documents = useQuery({
    ...storageListDocumentsQuery({}),
    enabled: !isLoading && Boolean(session),
    select: (rows) => rows.map((row) => ({ ...row, created_at: row.createdAt })),
  })
  const files = useMemo(
    () => (documents.isPending ? 'loading' : documents.isError ? 'error' : (documents.data ?? [])),
    [documents.isPending, documents.isError, documents.data],
  )
  const invalidate = () => client.invalidateQueries({ queryKey: storageKeys.all })
  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, null),
    onSuccess: invalidate,
  })
  const deletion = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate })
  const [pending, setPending] = useState<Item[]>([])
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const bump = useSyncStatus((s) => s.bump)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<'new' | 'name' | 'size'>('new')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)
  const all = useMemo<Item[]>(() => {
    const up = Array.isArray(files) ? files : []
    return [
      ...myDocs.map((d) => ({
        id: d.id,
        title: d.title,
        kind: 'exam' as const,
        updatedAt: d.updatedAt,
        size: docSize(d),
      })),
      ...myDecks.map((dk) => ({
        id: dk.id,
        title: dk.title,
        kind: 'slide' as const,
        updatedAt: dk.updatedAt,
        size: new Blob([JSON.stringify(dk)]).size,
      })),
      ...boards.map((b) => ({
        id: b.id,
        title: b.title,
        kind: 'board' as const,
        updatedAt: b.updatedAt,
        size: JSON.stringify(b.data).length,
      })),
      ...up.map((d) => ({
        id: d.id,
        title: d.name,
        kind: 'file' as const,
        updatedAt: d.created_at,
        size: d.size,
        url: d.url,
        mime: d.mime,
      })),
    ]
  }, [myDocs, myDecks, boards, files])
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase()
    const out = all.filter(
      (d) => (filter === 'all' || d.kind === filter) && (!k || d.title.toLowerCase().includes(k)),
    )
    if (sort === 'name') out.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
    else if (sort === 'size') out.sort((a, b) => b.size - a.size)
    else out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return out
  }, [all, q, filter, sort])
  useEffect(() => setPage(1), [q, filter, sort])
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const currentPage = Math.min(page, pages)
  const pageItems = [
    ...(currentPage === 1 ? pending : []),
    ...shown.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
  ]
  const goPage = (p: number) => {
    setPage(p)
    listRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  const countOf = (k: Kind) => all.filter((d) => d.kind === k).length
  const onPick = async (ev: ChangeEvent<HTMLInputElement>) => {
    const list = [...(ev.target.files ?? [])]
    ev.target.value = ''
    if (list.length === 0) return
    setErr('')
    const now = new Date().toISOString()
    const jobs = list.map((f, i) => ({
      file: f,
      item: {
        id: `up-${Date.now()}-${i}`,
        title: f.name,
        kind: 'file' as const,
        updatedAt: now,
        size: f.size,
        mime: f.type,
        pending: 'waiting' as Item['pending'],
      },
    }))
    setPending((cur) => [...jobs.map((j) => j.item), ...cur])
    const patch = (id: string, p: Item['pending'] | null) =>
      setPending((cur) =>
        p === null
          ? cur.filter((x) => x.id !== id)
          : cur.map((x) => (x.id === id ? { ...x, pending: p } : x)),
      )
    for (const { file, item } of jobs) {
      if (!DOC_TYPES[file.type]) {
        patch(item.id, { error: t('profileCopy.m52') })
        continue
      }
      patch(item.id, 'uploading')
      try {
        await upload.mutateAsync(file)
        patch(item.id, null)
      } catch (error) {
        patch(item.id, { error: error instanceof Error ? error.message : t('profileCopy.m53') })
      }
    }
    bump()
  }
  const open = (it: Item) => {
    if (it.pending) return
    if (it.kind === 'file' && it.url)
      openDocument({ url: it.url, name: it.title, mime: it.mime }).catch(
        (error: unknown) =>
          void dialog.alert(error instanceof Error ? error.message : t('profileCopy.m54')),
      )
    else
      navigate(appPaths.editor.href, {
        state: { openTab: true, open: { kind: it.kind, id: it.id } },
      })
  }
  const onDelete = async (it: Item) => {
    if (typeof it.pending === 'object')
      return setPending((cur) => cur.filter((x) => x.id !== it.id))
    if (
      !(await dialog.confirm(t('profileCopy.m55', { value0: it.title }), {
        title: t('profileCopy.m56'),
        danger: true,
        confirmLabel: t('profileCopy.m57'),
      }))
    )
      return
    try {
      if (it.kind === 'file') {
        await deletion.mutateAsync(it.id)
      } else if (it.kind === 'slide') useDocStore.getState().deleteDeck(it.id)
      else if (it.kind === 'board') {
        useBoards.getState().remove(it.id)
        useComposeStore.getState().closeTab(it.id)
      } else useDocStore.getState().deleteDoc(it.id)
    } catch (error) {
      setErr(error instanceof Error ? error.message : t('profileCopy.m58'))
    }
    bump()
  }
  const empty = all.length === 0 && pending.length === 0
  return {
    viewState: 0 as const,
    all,
    fileRef,
    onPick,
    err,
    files,
    empty,
    listRef,
    q,
    setQ,
    sort,
    setSort,
    filter,
    setFilter,
    countOf,
    pageItems,
    open,
    onDelete,
    pages,
    cur: currentPage,
    shown,
    goPage,
  }
}
