'use client'
import {
  data_bank_BANK as BANK,
  data_types_GRADES as GRADES,
  data_types_SUBJECTS as SUBJECTS,
  data_types_TYPE_LABEL as TYPE_LABEL,
  examEditor_toolImages_figureDoc as figureDoc,
  examEditor_toolImages_figureImageAttrs as figureImageAttrs,
  lib_questionImage_imageToSrc as imageToSrc,
  data_bankLevel_levelOf as levelOf,
  data_bank_loadStaticBank as loadStaticBank,
} from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { t as translate } from '@/i18n/translate-admin-pages'
import { bankSchema } from '@/modules/admin-pages/hooks/admin-schemas'
import { usePaged } from '@/modules/admin-pages/hooks/use-admin-paged'
import { useAdminRequests } from '@/modules/admin-pages/hooks/use-admin-requests'
import { useDrawerExit } from '@/modules/admin-pages/hooks/use-drawer-exit'

import type { SiteSelectOption } from '@/components/product-ui'
import type {
  lib_adminBankApi_AdminBankItem as AdminBankItem,
  lib_adminApi_AdminMe as AdminMe,
  lib_bankImport_BankDraft as BankDraft,
  data_bank_BankEntry as BankEntry,
  lib_adminBankApi_BankItemOrigin as BankItemOrigin,
  lib_adminBankApi_BankQuestionRow as BankQuestionRow,
  data_types_Option as Option,
  data_types_QuestionImage as QuestionImage,
  data_types_QuestionType as QuestionType,
  data_types_Subject as Subject,
} from '@admin-pages-engine'
export const figureCache = new Map<
  string,
  {
    src: string
    alt: string
  } | null
>()
export function figureOf(entry: BankEntry) {
  if (entry.image?.src) return { src: entry.image.src, alt: entry.image.alt ?? '' }
  if (!entry.figure) return null
  if (!figureCache.has(entry.id)) {
    const doc = figureDoc(entry.figure)
    figureCache.set(entry.id, doc ? figureImageAttrs(doc) : null)
  }
  return figureCache.get(entry.id) ?? null
}
export const ORIGIN_LABEL: Record<BankItemOrigin, string> = {
  'goc': translate('adminPagesCopy.m279'),
  'da-sua': translate('adminPagesCopy.m280'),
  'cau-moi': translate('adminPagesCopy.m281'),
  'da-an': translate('adminPagesCopy.m282'),
}
export const ORIGIN_TONE: Record<BankItemOrigin, 'neutral' | 'honey' | 'sage' | 'clay'> = {
  'goc': 'neutral',
  'da-sua': 'honey',
  'cau-moi': 'sage',
  'da-an': 'clay',
}
export const SUBJECT_SELECT_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m283') },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]
export const GRADE_SELECT_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m284') },
  ...GRADES.map((g) => ({ value: g, label: g })),
]
export const LEVEL_SELECT_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m285') },
  { value: 'de', label: translate('adminPagesCopy.m286') },
  { value: 'tb', label: translate('adminPagesCopy.m287') },
  { value: 'kho', label: translate('adminPagesCopy.m288') },
]
export const TYPE_SELECT_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m289') },
  ...(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] })),
]
export const ORIGIN_SELECT_OPTIONS: readonly SiteSelectOption<string>[] = [
  { value: '', label: translate('adminPagesCopy.m290') },
  { value: 'goc', label: translate('adminPagesCopy.m279') },
  { value: 'da-sua', label: translate('adminPagesCopy.m280') },
  { value: 'cau-moi', label: translate('adminPagesCopy.m281') },
  { value: 'da-an', label: translate('adminPagesCopy.m282') },
]
export function useBankPanelContainer({ me: _me }: { me: AdminMe }) {
  const { hideBankQuestion, listBankOverrides, revertBankQuestion, unhideBankQuestion } =
    useAdminRequests()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AdminBankItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [activeItem, setActiveItem] = useState<AdminBankItem | null>(null)
  const [editingItem, setEditingItem] = useState<AdminBankItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showMatrix, setShowMatrix] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [staticBank, overrides] = await Promise.all([
        loadStaticBank().catch(() => BANK),
        listBankOverrides().catch((error) => {
          console.warn(translate('adminPagesCopy.m291'), error)
          return [] as BankQuestionRow[]
        }),
      ])
      const overrideMap = new Map<string, BankQuestionRow>()
      for (const o of overrides) {
        overrideMap.set(o.id, o)
      }
      const mergedList: AdminBankItem[] = []
      const processedIds = new Set<string>()
      for (const staticItem of staticBank) {
        const o = overrideMap.get(staticItem.id)
        if (o) {
          if (o.status === 'hidden') {
            mergedList.push({
              entry: o.data?.prompt ? o.data : staticItem,
              origin: 'da-an',
              updatedAt: o.updated_at,
              updatedBy: o.updated_by,
            })
          } else {
            mergedList.push({
              entry: o.data,
              origin: 'da-sua',
              updatedAt: o.updated_at,
              updatedBy: o.updated_by,
            })
          }
        } else {
          mergedList.push({
            entry: staticItem,
            origin: 'goc',
          })
        }
        processedIds.add(staticItem.id)
      }
      for (const o of overrides) {
        if (!processedIds.has(o.id)) {
          mergedList.push({
            entry: o.data,
            origin: o.status === 'hidden' ? 'da-an' : 'cau-moi',
            updatedAt: o.updated_at,
            updatedBy: o.updated_by,
          })
          processedIds.add(o.id)
        }
      }
      setItems(mergedList)
      setActiveItem((current) =>
        current ? (mergedList.find((item) => item.entry.id === current.entry.id) ?? current) : null,
      )
    } catch (error) {
      console.error(translate('adminPagesCopy.m292'), error)
      void dialog.alert(translate('adminPagesCopy.m293'), {
        title: translate('adminPagesCopy.m25'),
      })
    } finally {
      setLoading(false)
    }
  }, [listBankOverrides])
  useEffect(() => {
    void loadData()
  }, [loadData])
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (subjectFilter && item.entry.subject !== subjectFilter) continue
      for (const t of item.entry.tags || []) {
        if (t.trim()) set.add(t.trim())
      }
    }
    return [...set].toSorted()
  }, [items, subjectFilter])
  const filteredItems = useMemo(() => {
    const qLower = debouncedSearch.toLowerCase()
    return items.filter((item) => {
      const e = item.entry
      if (originFilter && item.origin !== originFilter) return false
      if (subjectFilter && e.subject !== subjectFilter) return false
      if (gradeFilter && !e.grades.includes(gradeFilter) && !e.grades.includes('all')) return false
      if (levelFilter && levelOf(e) !== levelFilter) return false
      if (typeFilter && e.type !== typeFilter) return false
      if (tagFilter && !(e.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase()))
        return false
      if (qLower) {
        const inId = e.id.toLowerCase().includes(qLower)
        const inPrompt = (e.prompt || '').toLowerCase().includes(qLower)
        const inExplanation = (e.explanation || '').toLowerCase().includes(qLower)
        const inTags = (e.tags || []).some((t) => t.toLowerCase().includes(qLower))
        if (!inId && !inPrompt && !inExplanation && !inTags) return false
      }
      return true
    })
  }, [
    items,
    originFilter,
    subjectFilter,
    gradeFilter,
    levelFilter,
    typeFilter,
    tagFilter,
    debouncedSearch,
  ])
  const matrixStats = useMemo(() => {
    const stats: Record<
      string,
      {
        de: number
        tb: number
        kho: number
        total: number
      }
    > = {}
    for (const sub of SUBJECTS) {
      stats[sub] = { de: 0, tb: 0, kho: 0, total: 0 }
    }
    for (const item of items) {
      if (item.origin === 'da-an') continue
      const sub = item.entry.subject
      if (!stats[sub]) {
        stats[sub] = { de: 0, tb: 0, kho: 0, total: 0 }
      }
      const lvl = levelOf(item.entry)
      stats[sub][lvl]++
      stats[sub].total++
    }
    return stats
  }, [items])
  const filterResetKey = `${debouncedSearch}|${subjectFilter}|${gradeFilter}|${levelFilter}|${typeFilter}|${originFilter}|${tagFilter}`
  const { items: pageItems, page, pages, go } = usePaged(filteredItems, 30, filterResetKey)
  const handleHide = async (item: AdminBankItem) => {
    const ok = await dialog.confirm(
      translate('adminPagesCopy.m294', { value0: String(item.entry.id) }),
      {
        title: translate('adminPagesCopy.m295'),
        danger: true,
        confirmLabel: translate('adminPagesCopy.m296'),
      },
    )
    if (!ok) return
    try {
      await hideBankQuestion(item.entry.id, item.entry)
      void loadData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m297')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    }
  }
  const handleUnhide = async (item: AdminBankItem) => {
    try {
      await unhideBankQuestion(item.entry.id)
      void loadData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m298')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    }
  }
  const handleRevert = async (item: AdminBankItem) => {
    const isNew = item.origin === 'cau-moi'
    const ok = await dialog.confirm(
      isNew
        ? translate('adminPagesCopy.m299', { value0: String(item.entry.id) })
        : translate('adminPagesCopy.m300', { value0: String(item.entry.id) }),
      {
        title: isNew ? translate('adminPagesCopy.m301') : translate('adminPagesCopy.m302'),
        danger: true,
        confirmLabel: isNew ? translate('adminPagesCopy.m45') : translate('adminPagesCopy.m302'),
      },
    )
    if (!ok) return
    try {
      await revertBankQuestion(item.entry.id)
      setActiveItem(null)
      void loadData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m303')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    }
  }
  return {
    viewState: 0 as const,
    items,
    setShowMatrix,
    setEditingItem,
    setIsCreating,
    showMatrix,
    matrixStats,
    subjectFilter,
    setSubjectFilter,
    search,
    setSearch,
    gradeFilter,
    levelFilter,
    typeFilter,
    originFilter,
    tagFilter,
    setGradeFilter,
    setLevelFilter,
    setTypeFilter,
    setOriginFilter,
    setTagFilter,
    allTags,
    loading,
    filteredItems,
    page,
    pages,
    pageItems,
    setActiveItem,
    go,
    activeItem,
    handleHide,
    handleUnhide,
    handleRevert,
    isCreating,
    editingItem,
    loadData,
  }
}
export function useQuestionDrawerContainer({
  item,
  onClose,
  onEdit,
  onHide,
  onUnhide,
  onRevert,
}: {
  item: AdminBankItem
  onClose: () => void
  onEdit: () => void
  onHide: () => void
  onUnhide: () => void
  onRevert: () => void
}) {
  const { close, panelClass } = useDrawerExit(onClose)
  const e = item.entry
  const lvl = levelOf(e)
  const figure = figureOf(e)
  const isHidden = item.origin === 'da-an'
  const isCustomOrEdited = item.origin !== 'goc'
  return {
    viewState: 0 as const,
    close,
    panelClass,
    item,
    e,
    lvl,
    figure,
    isHidden,
    onUnhide,
    onHide,
    isCustomOrEdited,
    onRevert,
    onEdit,
  }
}
export function useQuestionFormModalContainer({
  initialEntry,
  origin,
  onAdded,
  onClose,
  onSaved,
}: {
  initialEntry?: BankEntry
  origin?: BankItemOrigin
  onAdded: () => void
  onClose: () => void
  onSaved: (entry: BankEntry) => void
}) {
  const { saveBankQuestion } = useAdminRequests()
  const isEdit = !!initialEntry
  const [subject, setSubject] = useState<Subject>(initialEntry?.subject ?? 'Toán')
  const [grades, setGrades] = useState<string[]>(
    initialEntry?.grades ?? [translate('adminPagesCopy.m304')],
  )
  const [type, setType] = useState<QuestionType>(initialEntry?.type ?? 'trac-nghiem')
  const [points, setPoints] = useState<number>(initialEntry?.points ?? 0.25)
  const [prompt, setPrompt] = useState(initialEntry?.prompt ?? '')
  const [image, setImage] = useState<QuestionImage | undefined>(initialEntry?.image)
  const [imgBusy, setImgBusy] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const pickImage = async (file: File) => {
    setImgBusy(true)
    setImgError(null)
    try {
      const src = await imageToSrc(file)
      if (src.startsWith('data:') && src.length > 40_000)
        throw new Error(translate('adminPagesCopy.m305'))
      setImage({ ...image, src })
    } catch (error) {
      setImgError(error instanceof Error ? error.message : translate('adminPagesCopy.m306'))
    } finally {
      setImgBusy(false)
    }
  }
  const [explanation, setExplanation] = useState(initialEntry?.explanation ?? '')
  const [solutionText, setSolutionText] = useState((initialEntry?.solution || []).join('\n'))
  const [tagsText, setTagsText] = useState((initialEntry?.tags || []).join(', '))
  const [variable, setVariable] = useState(initialEntry?.variable ?? false)
  const [options, setOptions] = useState<Option[]>(() => {
    if (initialEntry?.options && initialEntry.options.length > 0) {
      return initialEntry.options.map((o) => ({ ...o }))
    }
    return [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ]
  })
  const [answer, setAnswer] = useState(initialEntry?.answer ?? 'A')
  const [tfOptions, setTfOptions] = useState<
    {
      key: string
      text: string
      verdict: 'Đ' | 'S'
    }[]
  >(() => {
    const keys = ['a', 'b', 'c', 'd']
    const existing = initialEntry?.options || []
    const existingAns = initialEntry?.answer || translate('adminPagesCopy.m307')
    return keys.map((k, i) => ({
      key: k,
      text: existing[i]?.text ?? '',
      verdict: (existingAns[i] === 'S' ? 'S' : 'Đ') as 'Đ' | 'S',
    }))
  })
  const [shortAnswer, setShortAnswer] = useState(
    initialEntry?.type === 'tra-loi-ngan' ? (initialEntry.answer ?? '') : '',
  )
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const toggleGrade = (g: string) => {
    setGrades((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((x) => x !== g) : prev) : [...prev, g],
    )
  }
  const [addedCount, setAddedCount] = useState(0)
  const [formTab, setFormTab] = useState<'manual' | 'ai'>('manual')
  const [drafts, setDrafts] = useState<BankDraft[]>([])
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const parsedTags = () =>
    tagsText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  const editDraft = (d: BankDraft) => {
    setType(d.type)
    setPrompt(d.prompt)
    setImage(d.image)
    setExplanation(d.explanation ?? '')
    setSolutionText((d.solution ?? []).join('\n'))
    if (d.type === 'trac-nghiem') {
      setOptions(
        d.options?.length
          ? d.options.map((o) => ({ ...o }))
          : ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' })),
      )
      setAnswer(d.answer ?? d.options?.[0]?.key ?? 'A')
    } else if (d.type === 'dung-sai') {
      setTfOptions(
        ['a', 'b', 'c', 'd'].map((key, i) => ({
          key,
          text: d.options?.[i]?.text ?? '',
          verdict: d.answer?.[i] === 'S' ? 'S' : 'Đ',
        })),
      )
    } else if (d.type === 'tra-loi-ngan') {
      setShortAnswer(d.answer ?? '')
    }
    setErrorMsg(null)
    setEditingDraft(d.id)
    setFormTab('manual')
  }
  const saveDrafts = async (list: BankDraft[]) => {
    let done = 0
    let lastError = ''
    for (const d of list) {
      try {
        await saveBankQuestion(
          {
            id: '',
            subject,
            grades,
            type: d.type,
            prompt: d.prompt,
            points,
            options: d.options,
            answer: d.answer,
            explanation: d.explanation,
            solution: d.solution,
            tags: parsedTags(),
            variable,
            image: d.image,
          },
          'published',
        )
        setDrafts((cur) => cur.filter((x) => x.id !== d.id))
        done++
      } catch (error) {
        lastError = error instanceof Error ? error.message : translate('adminPagesCopy.m309')
      }
    }
    if (done) {
      setAddedCount((n) => n + done)
      onAdded()
    }
    if (lastError)
      await dialog.alert(
        translate('adminPagesCopy.m310', {
          value0: String(done),
          value1: String(list.length),
          value2: String(lastError),
        }),
        { title: translate('adminPagesCopy.m311') },
      )
  }
  const resetForNext = () => {
    setPrompt('')
    setImage(undefined)
    setImgError(null)
    setOptions(['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' })))
    setAnswer('A')
    setTfOptions(['a', 'b', 'c', 'd'].map((key) => ({ key, text: '', verdict: 'Đ' as const })))
    setShortAnswer('')
    setSolutionText('')
    setExplanation('')
    promptRef.current?.focus()
  }
  const form = useForm({ resolver: zodResolver(bankSchema), values: { prompt, grades, points } })
  const handleSave = async (e: React.SyntheticEvent, addNext = false) => {
    e.preventDefault()
    if (!(await form.trigger())) {
      setErrorMsg(
        form.getFieldState('prompt').error?.message ??
          form.getFieldState('grades').error?.message ??
          form.getFieldState('points').error?.message ??
          '',
      )
      return
    }
    setErrorMsg(null)
    if (!prompt.trim()) {
      setErrorMsg(translate('adminPagesCopy.m312'))
      return
    }
    if (prompt.trim().length > 5000) {
      setErrorMsg(translate('adminPagesCopy.m313'))
      return
    }
    if (grades.length === 0) {
      setErrorMsg(translate('adminPagesCopy.m314'))
      return
    }
    if (points <= 0) {
      setErrorMsg(translate('adminPagesCopy.m315'))
      return
    }
    let finalOptions: Option[] | undefined
    let finalAnswer = ''
    if (type === 'trac-nghiem') {
      if (options.length < 2) {
        setErrorMsg(translate('adminPagesCopy.m316'))
        return
      }
      if (options.some((o) => !o.text.trim())) {
        setErrorMsg(translate('adminPagesCopy.m317'))
        return
      }
      if (!options.some((o) => o.key === answer)) {
        setErrorMsg(translate('adminPagesCopy.m318'))
        return
      }
      finalOptions = options.map((o) => ({ key: o.key, text: o.text.trim() }))
      finalAnswer = answer
    } else if (type === 'dung-sai') {
      if (tfOptions.some((o) => !o.text.trim())) {
        setErrorMsg(translate('adminPagesCopy.m319'))
        return
      }
      finalOptions = tfOptions.map((o) => ({ key: o.key, text: o.text.trim() }))
      finalAnswer = tfOptions.map((o) => o.verdict).join('')
    } else if (type === 'tra-loi-ngan') {
      if (!shortAnswer.trim()) {
        setErrorMsg(translate('adminPagesCopy.m320'))
        return
      }
      finalAnswer = shortAnswer.trim()
    }
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const solution = solutionText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: BankEntry = {
      id: initialEntry?.id || '',
      subject,
      grades,
      type,
      prompt: prompt.trim(),
      points,
      options: finalOptions,
      answer: finalAnswer || undefined,
      explanation: explanation.trim() || undefined,
      solution: solution.length > 0 ? solution : undefined,
      tags,
      variable,
      figure: initialEntry?.figure,
      image,
    }
    setSaving(true)
    try {
      const res = await saveBankQuestion(payload, origin === 'da-an' ? 'hidden' : 'published')
      if (editingDraft) {
        setDrafts((cur) => cur.filter((x) => x.id !== editingDraft))
        setEditingDraft(null)
        setAddedCount((n) => n + 1)
        resetForNext()
        onAdded()
        setFormTab('ai')
      } else if (addNext) {
        setAddedCount((n) => n + 1)
        resetForNext()
        onAdded()
      } else {
        onSaved(res.entry)
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m321')
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }
  return {
    viewState: 0 as const,
    onClose,
    isEdit,
    initialEntry,
    formTab,
    setFormTab,
    drafts,
    setSubject,
    setType,
    points,
    setPoints,
    toggleGrade,
    subject,
    grades,
    type,
    setDrafts,
    editDraft,
    saveDrafts,
    handleSave,
    saving,
    promptRef,
    prompt,
    setPrompt,
    image,
    setImage,
    imgBusy,
    imgError,
    pickImage,
    options,
    setOptions,
    answer,
    setAnswer,
    tfOptions,
    setTfOptions,
    shortAnswer,
    setShortAnswer,
    solutionText,
    setSolutionText,
    explanation,
    setExplanation,
    tagsText,
    setTagsText,
    variable,
    setVariable,
    errorMsg,
    addedCount,
  }
}
