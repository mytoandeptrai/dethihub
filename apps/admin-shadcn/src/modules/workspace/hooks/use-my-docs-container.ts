'use client'
import { dialog } from '@engine-dialogs'
import {
  lib_docStatus_DOC_STATUS_LABELS as DOC_STATUS_LABELS,
  store_docs_STORAGE_QUOTA as STORAGE_QUOTA,
  components_appIcons_TrashIcon as TrashIcon,
  store_docs_totalDocSize as totalDocSize,
  store_docs_useDocStore as useDocStore,
  useNavigate,
} from '@workspace-engine'
import { FileText, Pencil, Presentation, Share2 } from 'lucide-react'
import { useMemo, useSyncExternalStore } from 'react'

import { appPaths } from '@/config/app-paths'
import { useUrlState } from '@/hooks'
import { t } from '@/i18n/translate-workspace'
import { filterAndSort, metadataOptions } from '@/modules/workspace/hooks/my-docs-model'

import type { LibraryItem, SortKey } from '@/modules/workspace/hooks/my-docs-model'
import type {
  store_docs_Deck as Deck,
  lib_docStatus_DocStatus as DocStatus,
  data_docTypes_ExamDoc as ExamDoc,
} from '@workspace-engine'
export const SORTS: {
  key: SortKey
  label: string
}[] = [
  { key: 'recent', label: t('workspaceCopy.m1') },
  { key: 'oldest', label: t('workspaceCopy.m2') },
  { key: 'name', label: t('workspaceCopy.m3') },
  { key: 'size', label: t('workspaceCopy.m4') },
]
export const STATUS_STYLES: Record<DocStatus, string> = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  archived: 'border-amber-200 bg-amber-50 text-amber-800',
}
export type RowAction = {
  label: string
  icon: React.ComponentType<{
    className?: string
  }>
  fn: () => void
  danger?: boolean
}
export function rowActions(
  d: ExamDoc,
  handlers: {
    onOpen: (d: ExamDoc) => void
    onRename: (d: ExamDoc) => void
    onShare: (d: ExamDoc) => void
    onDelete: (d: ExamDoc) => void
  },
): RowAction[] {
  return [
    { label: t('workspaceCopy.m5'), icon: FileText, fn: () => handlers.onOpen(d) },
    { label: t('workspaceCopy.m6'), icon: Pencil, fn: () => handlers.onRename(d) },
    { label: t('workspaceCopy.m7'), icon: Share2, fn: () => handlers.onShare(d) },
    { label: t('workspaceCopy.m8'), icon: TrashIcon, fn: () => handlers.onDelete(d), danger: true },
  ]
}
export function subscribeHydration(notify: () => void) {
  const start = useDocStore.persist.onHydrate(notify)
  const finish = useDocStore.persist.onFinishHydration(notify)
  return () => {
    start()
    finish()
  }
}
export function useFilterSelectContainer({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: {
    value: string
    label: string
  }[]
}) {
  return { viewState: 0 as const, value, onChange, label, options }
}
export function useItemMenuContainer({
  item,
  actions,
  onStatusChange,
}: {
  item: LibraryItem
  actions: RowAction[]
  onStatusChange: (status: DocStatus) => void
}) {
  return { viewState: 0 as const, item, actions, onStatusChange }
}
const EMPTY_DOCS: ExamDoc[] = []
const EMPTY_DECKS: Deck[] = []
export function useMyDocsContainer() {
  const navigate = useNavigate()
  const store = useDocStore()
  const {
    openDoc,
    renameDoc,
    deleteDoc,
    openDeck,
    renameDeck,
    deleteDeck,
    setDocStatus,
    setDeckStatus,
  } = store
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useDocStore.persist.hasHydrated(),
    () => false,
  )
  const myDocs = hydrated ? store.myDocs : EMPTY_DOCS
  const myDecks = hydrated ? store.myDecks : EMPTY_DECKS
  const [sort, setSort] = useUrlState<SortKey>('sort', 'recent', [
    'recent',
    'oldest',
    'name',
    'size',
  ])
  const [view, setView] = useUrlState<'grid' | 'list'>('view', 'grid', ['grid', 'list'])
  const [q, setQ] = useUrlState<string>('q', '')
  const [tab, setTab] = useUrlState<'exam' | 'slide'>('tab', 'exam', ['exam', 'slide'])
  const [status, setStatus] = useUrlState<DocStatus | 'all'>('status', 'all', [
    'all',
    'draft',
    'published',
    'archived',
  ])
  const [subject, setSubject] = useUrlState<string>('subject', '')
  const [grade, setGrade] = useUrlState<string>('grade', '')
  const subjects = useMemo(() => metadataOptions(myDocs, 'subject'), [myDocs])
  const grades = useMemo(() => metadataOptions(myDocs, 'grade'), [myDocs])
  const source = useMemo<LibraryItem[]>(
    () =>
      tab === 'exam'
        ? myDocs.map((doc) => ({ kind: 'exam', doc }))
        : myDecks.map((doc) => ({ kind: 'slide', doc })),
    [tab, myDocs, myDecks],
  )
  const items = useMemo(
    () => filterAndSort(source, { query: q, status, subject, grade }, sort),
    [source, q, status, subject, grade, sort],
  )
  const used = totalDocSize(myDocs)
  const pct = Math.min(100, (used / STORAGE_QUOTA) * 100)
  const reset = () => {
    setQ('')
    setStatus('all')
    setSubject('')
    setGrade('')
  }
  const chips = [
    ...(q.trim() ? [{ id: 'query', label: q.trim(), remove: () => setQ('') }] : []),
    ...(status === 'all'
      ? []
      : [{ id: 'status', label: DOC_STATUS_LABELS[status], remove: () => setStatus('all') }]),
    ...(tab === 'exam' && subject
      ? [{ id: 'subject', label: subject, remove: () => setSubject('') }]
      : []),
    ...(tab === 'exam' && grade
      ? [
          {
            id: 'grade',
            label: t('workspaceCopy.m9', { value0: grade }),
            remove: () => setGrade(''),
          },
        ]
      : []),
  ]
  const onOpen = (d: ExamDoc) => {
    openDoc(d)
    navigate(appPaths.editor.href, { state: { openTab: true, open: { kind: 'exam', id: d.id } } })
  }
  const onRename = async (d: ExamDoc) => {
    const title = await dialog.prompt('', {
      title: t('workspaceCopy.m10'),
      label: t('workspaceCopy.m11'),
      defaultValue: d.title,
    })
    if (title?.trim()) renameDoc(d.id, title.trim())
  }
  const onShare = (d: ExamDoc) => {
    const url = window.location.origin + appPaths.exams.getHref(d.id)
    void navigator.clipboard?.writeText(url).catch(() => {})
    void dialog.alert(url, { title: t('workspaceCopy.m12') })
  }
  const onDelete = async (d: ExamDoc) => {
    if (
      await dialog.confirm(t('workspaceCopy.m13', { value0: d.title }), {
        title: t('workspaceCopy.m14'),
        confirmLabel: t('workspaceCopy.m8'),
        danger: true,
      })
    )
      deleteDoc(d.id)
  }
  const onOpenDeck = (d: Deck) => {
    openDeck(d)
    navigate(appPaths.editor.href, { state: { openTab: true, open: { kind: 'slide', id: d.id } } })
  }
  const onRenameDeck = async (d: Deck) => {
    const title = await dialog.prompt('', {
      title: t('workspaceCopy.m10'),
      label: t('workspaceCopy.m11'),
      defaultValue: d.title,
    })
    if (title?.trim()) renameDeck(d.id, title.trim())
  }
  const onDeleteDeck = async (d: Deck) => {
    if (
      await dialog.confirm(t('workspaceCopy.m13', { value0: d.title }), {
        title: t('workspaceCopy.m14'),
        confirmLabel: t('workspaceCopy.m8'),
        danger: true,
      })
    )
      deleteDeck(d.id)
  }
  const openItem = (item: LibraryItem) =>
    item.kind === 'exam' ? onOpen(item.doc) : onOpenDeck(item.doc)
  const changeStatus = (item: LibraryItem, nextStatus: DocStatus) =>
    item.kind === 'exam'
      ? setDocStatus(item.doc.id, nextStatus)
      : setDeckStatus(item.doc.id, nextStatus)
  const actionsFor = (item: LibraryItem): RowAction[] =>
    item.kind === 'exam'
      ? rowActions(item.doc, { onOpen, onRename, onShare, onDelete })
      : [
          { label: t('workspaceCopy.m5'), icon: Presentation, fn: () => onOpenDeck(item.doc) },
          {
            label: t('workspaceCopy.m6'),
            icon: Pencil,
            fn: () => {
              void onRenameDeck(item.doc)
            },
          },
          {
            label: t('workspaceCopy.m8'),
            icon: TrashIcon,
            fn: () => {
              void onDeleteDeck(item.doc)
            },
            danger: true,
          },
        ]
  return {
    viewState: 0 as const,
    tab,
    setTab,
    myDocs,
    myDecks,
    openEditor: () => navigate(appPaths.editor.href),
    used,
    pct,
    q,
    setQ,
    view,
    setView,
    status,
    setStatus,
    subject,
    setSubject,
    subjects,
    grade,
    setGrade,
    grades,
    sort,
    setSort,
    chips,
    reset,
    hydrated,
    items,
    openItem,
    actionsFor,
    changeStatus,
  }
}
