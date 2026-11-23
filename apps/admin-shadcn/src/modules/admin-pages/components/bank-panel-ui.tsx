'use client'
import {
  data_bankLevel_LEVEL_LABEL as LEVEL_LABEL,
  data_types_GRADES as METADATA_GRADES,
  data_types_SUBJECTS as METADATA_SUBJECTS,
  data_types_TYPE_LABEL as METADATA_TYPES,
  data_types_SUBJECTS as SUBJECTS,
  data_types_TYPE_LABEL as TYPE_LABEL,
  components_appIcons_TrashIcon as TrashIcon,
  data_bankLevel_levelOf as levelOf,
} from '@admin-pages-engine'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import {
  AlertCircle,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import Image from 'next/image'

import { MathText, QuestionImageField } from '@/components/online-exams-kernel'
import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  DropdownMenuItem,
  EmptyState,
  FilterChips,
  SiteSelect as MetadataSelect,
  PageHeader,
  Pager,
  Segmented,
  SiteSelect,
  Spinner,
  Toolbar,
  inputClass,
  inputClass as metadataInput,
} from '@/components/product-ui'
import { t as translate } from '@/i18n/translate'
import {
  AdminDrawer,
  AdminModal,
  AdminRowActions,
  AdminTable,
} from '@/modules/admin-pages/components/admin-primitives-ui'
import BankAiPanel from '@/modules/admin-pages/containers/bank-ai-panel-container'
import { BankPanelModel } from '@/modules/admin-pages/hooks'
import { formatViDateTime } from '@/modules/admin-pages/hooks/admin-utils'
import { keyedText } from '@/modules/admin-pages/hooks/keyed-text'

import type {
  BankPanelParts as Imported0,
  BankPanelParts as Imported1,
  BankPanelParts as Imported2,
} from '@/modules/admin-pages/containers/bank-panel-container/bank-panel-container'
import type {
  lib_adminBankApi_AdminBankItem as AdminBankItem,
  data_types_QuestionType as MetadataQuestionType,
} from '@admin-pages-engine'
const {
  figureOf,
  ORIGIN_LABEL,
  ORIGIN_TONE,
  SUBJECT_SELECT_OPTIONS,
  GRADE_SELECT_OPTIONS,
  LEVEL_SELECT_OPTIONS,
  TYPE_SELECT_OPTIONS,
  ORIGIN_SELECT_OPTIONS,
} = BankPanelModel
export function BankPanelBankPanelUi(
  props: ReturnType<typeof BankPanelModel.useBankPanelContainer> & {
    parts: typeof Imported0
  },
) {
  const { QuestionDrawer, QuestionFormModal } = props.parts
  if (props.viewState === 0) {
    const {
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
    } = props
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={translate('adminPagesCopy.m325')} className="mb-0 [&_h1]:text-2xl" />
            <p className="text-ink-3 text-[13.5px]">
              {translate('adminPagesCopy.m326')}
              {items.length.toLocaleString('vi-VN')}
              {translate('adminPagesCopy.m327')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMatrix((v) => !v)}
              data-tip={translate('adminPagesCopy.m328')}
              aria-label={translate('adminPagesCopy.m328')}
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">{translate('adminPagesCopy.m329')}</span>
            </Button>
            <Button
              variant="clay"
              size="sm"
              onClick={() => {
                setEditingItem(null)
                setIsCreating(true)
              }}
            >
              <Plus className="size-4" />
              <span>{translate('adminPagesCopy.m330')}</span>
            </Button>
          </div>
        </div>

        {showMatrix && (
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <BookOpen className="text-ink-3 size-4 shrink-0" />
                <h2 className="text-ink text-[14px] font-bold">
                  {translate('adminPagesCopy.m331')}
                </h2>
                <span className="text-ink-4 text-[12px]">{translate('adminPagesCopy.m332')}</span>
              </div>
              <span className="text-ink-4 text-[12px]">{translate('adminPagesCopy.m333')}</span>
            </div>
            <div className="max-h-[65vh] overflow-auto overscroll-contain">
              <AdminTable className="w-full min-w-[560px] text-left text-[13px]">
                <thead>
                  <tr className="border-line text-ink-3 border-b">
                    <th className="pb-2 font-medium">{translate('adminPagesCopy.m267')}</th>
                    <th className="pb-2 text-center font-medium">
                      {translate('adminPagesCopy.m286')}
                    </th>
                    <th className="pb-2 text-center font-medium">
                      {translate('adminPagesCopy.m287')}
                    </th>
                    <th className="pb-2 text-center font-medium">
                      {translate('adminPagesCopy.m288')}
                    </th>
                    <th className="pb-2 text-right font-medium">
                      {translate('adminPagesCopy.m334')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-line/60 divide-y">
                  {SUBJECTS.map((sub) => {
                    const s = matrixStats[sub] || { de: 0, tb: 0, kho: 0, total: 0 }
                    const isSelected = subjectFilter === sub
                    const isLow = s.total < 10
                    return (
                      <tr
                        key={sub}
                        onClick={() => setSubjectFilter((cur) => (cur === sub ? '' : sub))}
                        className={cn(
                          'hover:bg-paper-2 cursor-pointer transition-colors',
                          isSelected && 'bg-clay/10 text-clay font-semibold',
                        )}
                      >
                        <td className="py-2 font-medium">
                          <span className="flex items-center gap-1.5">
                            {sub}
                            {isLow && (
                              <span
                                className="size-1.5 rounded-full bg-amber-500"
                                data-tip={translate('adminPagesCopy.m335')}
                              />
                            )}
                          </span>
                        </td>
                        <td className="tnum text-ink-2 py-2 text-center">{s.de}</td>
                        <td className="tnum text-ink-2 py-2 text-center">{s.tb}</td>
                        <td className="tnum text-ink-2 py-2 text-center">{s.kho}</td>
                        <td className="tnum text-ink py-2 text-right font-semibold">{s.total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </AdminTable>
            </div>
          </Card>
        )}

        <Toolbar className="block space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate('adminPagesCopy.m336')}
                className={cn(inputClass, 'pl-9 text-[13.5px]')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-ink-4 hover:text-ink absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={translate('adminPagesCopy.m58')}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {(subjectFilter ||
              gradeFilter ||
              levelFilter ||
              typeFilter ||
              originFilter ||
              tagFilter ||
              search) && (
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSubjectFilter('')
                  setGradeFilter('')
                  setLevelFilter('')
                  setTypeFilter('')
                  setOriginFilter('')
                  setTagFilter('')
                }}
                className="text-clay shrink-0"
              >
                <RotateCcw className="size-3.5" />
                <span>{translate('adminPagesCopy.m337')}</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <SiteSelect
              label={translate('adminPagesCopy.m267')}
              value={subjectFilter}
              options={SUBJECT_SELECT_OPTIONS}
              onChange={setSubjectFilter}
            />
            <SiteSelect
              label={translate('adminPagesCopy.m338')}
              value={gradeFilter}
              options={GRADE_SELECT_OPTIONS}
              onChange={setGradeFilter}
            />
            <SiteSelect
              label={translate('adminPagesCopy.m339')}
              value={levelFilter}
              options={LEVEL_SELECT_OPTIONS}
              onChange={setLevelFilter}
            />
            <SiteSelect
              label={translate('adminPagesCopy.m322')}
              value={typeFilter}
              options={TYPE_SELECT_OPTIONS}
              onChange={setTypeFilter}
            />
            <SiteSelect
              label={translate('adminPagesCopy.m64')}
              value={originFilter}
              options={ORIGIN_SELECT_OPTIONS}
              onChange={setOriginFilter}
            />
          </div>

          {allTags.length > 0 && (
            <FilterChips className="pt-1">
              <span className="text-ink-4 flex items-center gap-1 text-[12px] font-medium">
                <Filter className="size-3" />
                {translate('adminPagesCopy.m340')}
              </span>
              {allTags.slice(0, 10).map((t) => {
                const active = tagFilter === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagFilter((cur) => (cur === t ? '' : t))}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11.5px] transition-colors',
                      active
                        ? 'bg-ink font-semibold text-white'
                        : 'bg-sunken text-ink-2 hover:bg-veil',
                    )}
                  >
                    {t}
                  </button>
                )
              })}
              {tagFilter && !allTags.slice(0, 10).includes(tagFilter) && (
                <button
                  type="button"
                  onClick={() => setTagFilter('')}
                  className="bg-ink rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold text-white"
                >
                  {tagFilter} <X className="ml-1 inline size-3" />
                </button>
              )}
            </FilterChips>
          )}
        </Toolbar>

        {loading ? (
          <div className="flex justify-center py-16">
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="text-ink-4 size-8" />}
            title={translate('adminPagesCopy.m341')}
          />
        ) : (
          <Card className="divide-line divide-y overflow-hidden">
            <div className="bg-paper-2 text-ink-3 flex items-center justify-between px-4 py-2.5 text-[12.5px]">
              <span>
                {translate('adminPagesCopy.m342')}
                <strong className="text-ink">{filteredItems.length}</strong>
                {translate('adminPagesCopy.m343')}
              </span>
              <span>
                {translate('adminPagesCopy.m344')}
                {page}
                {translate('adminPagesCopy.m143')}
                {pages}
              </span>
            </div>

            <div className="divide-line/70 divide-y">
              {pageItems.map((item) => {
                const e = item.entry
                const lvl = levelOf(e)
                const figure = figureOf(e)
                const isHidden = item.origin === 'da-an'
                return (
                  <div
                    key={e.id}
                    onClick={() => setActiveItem(item)}
                    className={cn(
                      'group hover:bg-paper-2/80 flex cursor-pointer flex-col gap-2 p-4 transition-colors sm:flex-row sm:items-start sm:gap-4',
                      isHidden && 'bg-sunken/40 opacity-75',
                    )}
                  >
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:w-44 sm:flex-col sm:items-start">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={ORIGIN_TONE[item.origin]}>{ORIGIN_LABEL[item.origin]}</Badge>
                        <Badge tone="neutral">{e.subject}</Badge>
                      </div>
                      <span
                        className="text-ink-4 max-w-[170px] truncate font-mono text-[11px]"
                        data-tip={e.id}
                      >
                        {e.id}
                      </span>
                      <div className="text-ink-3 flex items-center gap-1 text-[11.5px]">
                        <span>{e.grades.join(', ')}</span>
                        <span>{translate('adminPagesCopy.m345')}</span>
                        <span className={cn(lvl === 'kho' ? 'text-clay font-medium' : '')}>
                          {LEVEL_LABEL[lvl]}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-ink line-clamp-2 text-[14px] leading-relaxed">
                        <MathText as="div">{e.prompt}</MathText>
                      </div>

                      {e.tags && e.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-sunken text-ink-3 rounded px-1.5 py-0.5 text-[11px]"
                            >
                              {translate('adminPagesCopy.m262')}
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                      {figure ? (
                        <div className="border-line-2 size-10 overflow-hidden rounded border bg-white p-0.5">
                          <Image
                            unoptimized
                            width={0}
                            height={0}
                            src={figure.src}
                            alt=""
                            className="size-full object-contain"
                          />
                        </div>
                      ) : (
                        <Badge tone="outline" className="text-[12px]">
                          {e.points}
                          {translate('adminPagesCopy.m346')}
                        </Badge>
                      )}
                      <AdminRowActions>
                        <DropdownMenuItem onSelect={() => setActiveItem(item)}>
                          {translate('adminPagesCopy.m347')}
                        </DropdownMenuItem>
                      </AdminRowActions>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4">
              <Pager page={page} pages={pages} go={go} />
            </div>
          </Card>
        )}

        {activeItem && (
          <QuestionDrawer
            item={activeItem}
            onClose={() => setActiveItem(null)}
            onEdit={() => {
              setEditingItem(activeItem)
              setIsCreating(false)
            }}
            onHide={() => handleHide(activeItem)}
            onUnhide={() => handleUnhide(activeItem)}
            onRevert={() => handleRevert(activeItem)}
          />
        )}

        {(isCreating || editingItem) && (
          <QuestionFormModal
            initialEntry={editingItem?.entry}
            origin={editingItem?.origin}
            onAdded={() => void loadData()}
            onClose={() => {
              setEditingItem(null)
              setIsCreating(false)
            }}
            onSaved={async (savedEntry) => {
              setEditingItem(null)
              setIsCreating(false)
              await loadData()
              const freshItem: AdminBankItem = {
                entry: savedEntry,
                origin: savedEntry.id.startsWith('db-') ? 'cau-moi' : 'da-sua',
                updatedAt: new Date().toISOString(),
              }
              setActiveItem(freshItem)
            }}
          />
        )}
      </div>
    )
  }
  return null
}
export function BankPanelQuestionDrawerUi(
  props: ReturnType<typeof BankPanelModel.useQuestionDrawerContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const {
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
    } = props
    return (
      <AdminDrawer
        onClose={close}
        className={cn(
          'border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l shadow-2xl sm:w-[560px]',
          panelClass,
        )}
        aria-label={translate('adminPagesCopy.m347')}
      >
        <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Badge tone={ORIGIN_TONE[item.origin]} className="shrink-0">
              {ORIGIN_LABEL[item.origin]}
            </Badge>
            <h2 className="text-ink truncate font-mono text-[13px] font-semibold" data-tip={e.id}>
              {e.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5 transition-colors"
            aria-label={translate('adminPagesCopy.m136')}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <Badge tone="clay">{e.subject}</Badge>
            <Badge tone="outline">{TYPE_LABEL[e.type]}</Badge>
            <Badge tone="neutral">{LEVEL_LABEL[lvl]}</Badge>
            <Badge tone="outline">
              {e.points}
              {translate('adminPagesCopy.m346')}
            </Badge>
            <span className="text-ink-4">
              {translate('adminPagesCopy.m348')}
              {e.grades.join(', ')}
            </span>
            {item.updatedAt && (
              <span className="text-ink-4 ml-auto text-[11.5px]">
                {translate('adminPagesCopy.m349')}
                {formatViDateTime(item.updatedAt)}
              </span>
            )}
          </div>

          <div className="border-line-2 bg-paper text-ink rounded-[8px] border p-4 text-[15px] leading-relaxed">
            <MathText as="div">{e.prompt}</MathText>
          </div>

          {figure && (
            <div className="border-line-2 flex justify-center rounded-[8px] border bg-white p-3">
              <Image
                unoptimized
                width={0}
                height={0}
                src={figure.src}
                alt={figure.alt}
                style={{ width: 'auto', height: 'auto' }}
                className="max-h-[260px] max-w-full object-contain"
              />
            </div>
          )}

          {e.type === 'trac-nghiem' && e.options && e.options.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-ink-3 text-[13px] font-semibold">
                {translate('adminPagesCopy.m350')}
              </h3>
              <ol className="flex flex-col gap-2">
                {e.options.map((o) => {
                  const isCorrect = e.answer === o.key
                  return (
                    <li
                      key={o.key}
                      className={cn(
                        'flex items-start gap-3 rounded-[6px] border px-3.5 py-2.5 text-[14px]',
                        isCorrect
                          ? 'border-sage/50 bg-sage-soft text-ink font-medium'
                          : 'border-line-2 text-ink-2',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5.5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                          isCorrect ? 'bg-sage text-white' : 'bg-sunken text-ink-3',
                        )}
                      >
                        {o.key}
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <MathText as="span">{o.text}</MathText>
                      </span>
                      {isCorrect && (
                        <span className="text-sage flex shrink-0 items-center gap-1 text-[12px] font-semibold">
                          <Check className="size-3.5" />
                          {translate('adminPagesCopy.m351')}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {e.type === 'dung-sai' && e.options && e.options.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-ink-3 text-[13px] font-semibold">
                {translate('adminPagesCopy.m352')}
              </h3>
              <ol className="flex flex-col gap-2">
                {e.options.map((o, idx) => {
                  const ansChar = e.answer?.[idx]
                  return (
                    <li
                      key={o.key}
                      className="border-line-2 flex items-start gap-3 rounded-[6px] border px-3.5 py-2.5 text-[14px]"
                    >
                      <span className="text-ink-3 shrink-0 font-semibold">
                        {o.key}
                        {translate('adminPagesCopy.m353')}
                      </span>
                      <span className="text-ink-2 min-w-0 flex-1 pt-0.5">
                        <MathText as="span">{o.text}</MathText>
                      </span>
                      {ansChar && (
                        <span
                          className={cn(
                            'shrink-0 rounded px-2 py-0.5 text-[12px] font-bold',
                            ansChar === 'Đ' ? 'bg-sage-soft text-sage' : 'bg-clay/10 text-clay',
                          )}
                        >
                          {ansChar === 'Đ' ? translate('adminPagesCopy.m354') : 'Sai'}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {e.type === 'tra-loi-ngan' && e.answer && (
            <div className="border-sage/40 bg-sage-soft rounded-[6px] border p-3.5 text-[14px]">
              <span className="text-ink-3">{translate('adminPagesCopy.m355')}</span>
              <strong className="text-ink">{e.answer}</strong>
            </div>
          )}

          {e.solution && e.solution.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-ink-3 text-[13px] font-semibold">
                {translate('adminPagesCopy.m356')}
              </h3>
              <div className="border-line bg-sunken/40 space-y-1.5 rounded-[6px] border p-3.5 text-[14px] leading-relaxed">
                {keyedText(e.solution).map(({ key, value: line }) => (
                  <MathText key={key} as="div">
                    {line}
                  </MathText>
                ))}
              </div>
            </div>
          )}

          {e.explanation && (
            <div className="space-y-1.5">
              <h3 className="text-ink-3 text-[13px] font-semibold">
                {translate('adminPagesCopy.m357')}
              </h3>
              <div className="border-line bg-sunken/40 rounded-[6px] border p-3.5 text-[14px] leading-relaxed">
                <MathText as="div">{e.explanation}</MathText>
              </div>
            </div>
          )}

          {e.tags && e.tags.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-ink-4 text-[12px] font-semibold">
                {translate('adminPagesCopy.m358')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="bg-paper-2 text-ink-2 rounded px-2 py-0.5 text-[12px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-line bg-paper flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <div className="flex items-center gap-2">
            {isHidden ? (
              <Button variant="outline" size="sm" onClick={onUnhide} className="text-sage">
                <Eye className="size-4" />
                <span>{translate('adminPagesCopy.m359')}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onHide}
                className="text-ink-3 hover:text-clay"
              >
                <EyeOff className="size-4" />
                <span>{translate('adminPagesCopy.m296')}</span>
              </Button>
            )}

            {isCustomOrEdited && (
              <Button
                variant="quiet"
                size="sm"
                onClick={onRevert}
                className="text-ink-3 hover:text-clay"
              >
                {item.origin === 'cau-moi' ? (
                  <>
                    <TrashIcon className="size-4" />
                    <span>{translate('adminPagesCopy.m360')}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-4" />
                    <span>{translate('adminPagesCopy.m302')}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Button variant="clay" size="sm" onClick={onEdit}>
            <span>{translate('adminPagesCopy.m361')}</span>
          </Button>
        </div>
      </AdminDrawer>
    )
  }
  return null
}
export function BankPanelQuestionFormModalUi(
  props: ReturnType<typeof BankPanelModel.useQuestionFormModalContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    const {
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
    } = props
    const metaFields = (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-ink mb-1.5 block text-[13px] font-semibold">
              {translate('adminPagesCopy.m267')}
            </label>
            <MetadataSelect
              label={translate('adminPagesCopy.m267')}
              value={subject}
              options={METADATA_SUBJECTS.map((s) => ({ value: s, label: s }))}
              onChange={setSubject}
            />
          </div>

          <div>
            <label className="text-ink mb-1.5 block text-[13px] font-semibold">
              {translate('adminPagesCopy.m322')}
            </label>
            <MetadataSelect
              label={translate('adminPagesCopy.m322')}
              value={type}
              options={(Object.keys(METADATA_TYPES) as MetadataQuestionType[]).map((k) => ({
                value: k,
                label: METADATA_TYPES[k],
              }))}
              onChange={setType}
            />
          </div>

          <div>
            <label className="text-ink mb-1.5 block text-[13px] font-semibold">
              {translate('adminPagesCopy.m323')}
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="10"
              value={points}
              onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
              className={cn(metadataInput, 'h-11 text-[14px]')}
            />
          </div>
        </div>

        <div>
          <label className="text-ink mb-1.5 block text-[13px] font-semibold">
            {translate('adminPagesCopy.m324')}
          </label>
          <div className="flex flex-wrap gap-2">
            {METADATA_GRADES.map((g) => {
              const checked = grades.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={cn(
                    'rounded-[6px] border px-3 py-1 text-[13px] font-medium transition-colors',
                    checked
                      ? 'border-clay bg-clay text-white'
                      : 'border-line-2 text-ink-2 hover:bg-paper-2 bg-white',
                  )}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
    return (
      <AdminModal
        title={translate('adminPagesCopy.m362')}
        onClose={onClose}
        className="inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:p-0"
      >
        <div className="border-line flex items-center justify-between border-b px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="text-ink text-[17px] font-bold">
              {isEdit
                ? translate('adminPagesCopy.m363', { value0: String(initialEntry!.id) })
                : translate('adminPagesCopy.m364')}
            </h2>
            {isEdit ? null : (
              <Segmented<'manual' | 'ai'>
                value={formTab}
                onChange={setFormTab}
                label={translate('adminPagesCopy.m365')}
                options={[
                  { key: 'manual', label: translate('adminPagesCopy.m366') },
                  {
                    key: 'ai',
                    label: translate('adminPagesCopy.m367'),
                    count: drafts.length > 0 ? drafts.length : undefined,
                  },
                ]}
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={translate('adminPagesCopy.m136')}
            className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5"
          >
            <X className="size-5" />
          </button>
        </div>

        {formTab === 'ai' ? (
          <BankAiPanel
            meta={metaFields}
            subject={subject}
            grade={grades[0] ?? translate('adminPagesCopy.m304')}
            type={type}
            drafts={drafts}
            setDrafts={setDrafts}
            onEdit={editDraft}
            onSaveDrafts={saveDrafts}
          />
        ) : (
          <>
            <form
              onSubmit={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !saving)
                  void handleSave(e, !isEdit)
              }}
              className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:overflow-hidden"
            >
              <div className="space-y-5 p-5 lg:overflow-y-auto">
                {metaFields}

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-ink text-[13px] font-semibold">
                      {translate('adminPagesCopy.m368')}
                    </label>
                    <span className="text-ink-4 text-[11.5px]">
                      {translate('adminPagesCopy.m369')}
                    </span>
                  </div>
                  <textarea
                    ref={promptRef}
                    autoFocus
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={translate('adminPagesCopy.m370')}
                    className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
                  />
                  <QuestionImageField
                    image={image}
                    onChange={setImage}
                    busy={imgBusy}
                    error={imgError}
                    pick={(f) => void pickImage(f)}
                  />

                  {prompt.trim() && (
                    <div className="border-line bg-paper-2/60 mt-2 rounded-[6px] border p-3">
                      <span className="text-ink-4 mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                        {translate('adminPagesCopy.m371')}
                      </span>
                      <div className="text-ink text-[14px] leading-relaxed">
                        <MathText as="div">{prompt}</MathText>
                      </div>
                    </div>
                  )}
                </div>

                {type === 'trac-nghiem' && (
                  <div className="border-line-2 bg-paper space-y-3 rounded-[8px] border p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-ink text-[13px] font-semibold">
                        {translate('adminPagesCopy.m372')}
                      </label>
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        onClick={() => {
                          const nextChar = String.fromCodePoint(65 + options.length)
                          setOptions([...options, { key: nextChar, text: '' }])
                        }}
                        className="h-8 text-[12px]"
                      >
                        <Plus className="size-3.5" />
                        {translate('adminPagesCopy.m373')}
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {options.map((o, idx) => (
                        <div key={o.key} className="flex items-start gap-2.5">
                          <label className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 px-1">
                            <input
                              type="radio"
                              name="correct-answer"
                              checked={answer === o.key}
                              onChange={() => setAnswer(o.key)}
                              className="text-clay focus:ring-clay size-4"
                            />
                            <span className="text-ink text-[13.5px] font-semibold">
                              {o.key}
                              {translate('adminPagesCopy.m238')}
                            </span>
                          </label>
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={o.text}
                              onChange={(e) => {
                                const next = [...options]
                                next[idx]!.text = e.target.value
                                setOptions(next)
                              }}
                              placeholder={translate('adminPagesCopy.m374', {
                                value0: String(o.key),
                              })}
                              className={cn(inputClass, 'h-10 text-[13.5px]')}
                            />
                            {o.text.trim() && (
                              <div className="text-ink-3 pl-1 text-[12px]">
                                <MathText as="span">{o.text}</MathText>
                              </div>
                            )}
                          </div>
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = options.filter((_, i) => i !== idx)
                                setOptions(next)
                                if (answer === o.key && next[0]) setAnswer(next[0].key)
                              }}
                              className="text-ink-4 hover:text-clay mt-2"
                              data-tip={translate('adminPagesCopy.m375')}
                              aria-label={translate('adminPagesCopy.m375')}
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'dung-sai' && (
                  <div className="border-line-2 bg-paper space-y-3 rounded-[8px] border p-4">
                    <label className="text-ink text-[13px] font-semibold">
                      {translate('adminPagesCopy.m376')}
                    </label>
                    <div className="space-y-3">
                      {tfOptions.map((o, idx) => (
                        <div key={o.key} className="flex items-start gap-3">
                          <span className="text-ink-3 mt-2 shrink-0 text-[14px] font-bold">
                            {o.key}
                            {translate('adminPagesCopy.m353')}
                          </span>
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={o.text}
                              onChange={(e) => {
                                const next = [...tfOptions]
                                next[idx]!.text = e.target.value
                                setTfOptions(next)
                              }}
                              placeholder={translate('adminPagesCopy.m377', {
                                value0: String(o.key),
                              })}
                              className={cn(inputClass, 'h-10 text-[13.5px]')}
                            />
                            {o.text.trim() && (
                              <div className="text-ink-3 pl-1 text-[12px]">
                                <MathText as="span">{o.text}</MathText>
                              </div>
                            )}
                          </div>
                          <div className="mt-1 flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...tfOptions]
                                next[idx]!.verdict = 'Đ'
                                setTfOptions(next)
                              }}
                              className={cn(
                                'rounded px-2.5 py-1 text-[12px] font-bold transition-colors',
                                o.verdict === 'Đ'
                                  ? 'bg-sage text-white'
                                  : 'bg-sunken text-ink-3 hover:bg-veil',
                              )}
                            >
                              {translate('adminPagesCopy.m354')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...tfOptions]
                                next[idx]!.verdict = 'S'
                                setTfOptions(next)
                              }}
                              className={cn(
                                'rounded px-2.5 py-1 text-[12px] font-bold transition-colors',
                                o.verdict === 'S'
                                  ? 'bg-clay text-white'
                                  : 'bg-sunken text-ink-3 hover:bg-veil',
                              )}
                            >
                              {translate('adminPagesCopy.m378')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'tra-loi-ngan' && (
                  <div>
                    <label className="text-ink mb-1.5 block text-[13px] font-semibold">
                      {translate('adminPagesCopy.m379')}
                    </label>
                    <input
                      type="text"
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value)}
                      placeholder={translate('adminPagesCopy.m380')}
                      className={cn(inputClass, 'h-10 text-[14px]')}
                    />
                  </div>
                )}
              </div>

              <div className="border-line space-y-5 p-5 lg:overflow-y-auto lg:border-l">
                <div>
                  <label className="text-ink mb-1.5 block text-[13px] font-semibold">
                    {translate('adminPagesCopy.m381')}
                    <span className="text-ink-4 text-[12px] font-normal">
                      {translate('adminPagesCopy.m382')}
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    placeholder={translate('adminPagesCopy.m383')}
                    className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
                  />
                </div>

                <div>
                  <label className="text-ink mb-1.5 block text-[13px] font-semibold">
                    {translate('adminPagesCopy.m384')}
                  </label>
                  <textarea
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={translate('adminPagesCopy.m385')}
                    className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
                  />
                  {explanation.trim() && (
                    <div className="border-line bg-paper-2/60 mt-2 rounded-[6px] border p-3">
                      <span className="text-ink-4 mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                        {translate('adminPagesCopy.m386')}
                      </span>
                      <div className="text-ink text-[13.5px] leading-relaxed">
                        <MathText as="div">{explanation}</MathText>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-ink mb-1.5 block text-[13px] font-semibold">
                      {translate('adminPagesCopy.m387')}
                      <span className="text-ink-4 text-[12px] font-normal">
                        {translate('adminPagesCopy.m388')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder={translate('adminPagesCopy.m389')}
                      className={cn(inputClass, 'h-10 text-[13.5px]')}
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={variable}
                        onChange={(e) => setVariable(e.target.checked)}
                        className="border-line-2 text-clay focus:ring-clay size-4.5 rounded"
                      />
                      <span className="text-ink text-[13.5px]">
                        {translate('adminPagesCopy.m390')}
                      </span>
                    </label>
                  </div>
                </div>

                {initialEntry?.figure && (
                  <div className="border-line-2 bg-sunken/40 text-ink-3 rounded-[6px] border p-3 text-[12.5px]">
                    {translate('adminPagesCopy.m391')}
                  </div>
                )}
              </div>
            </form>

            <div className="border-line bg-paper flex flex-wrap items-center justify-end gap-2.5 border-t px-5 py-3">
              <div className="mr-auto min-w-0 text-[13px]">
                {errorMsg ? (
                  <span className="text-clay flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    {errorMsg}
                  </span>
                ) : addedCount > 0 ? (
                  <span className="text-sage font-medium">
                    {translate('adminPagesCopy.m392')}
                    {addedCount}
                    {translate('adminPagesCopy.m231')}
                  </span>
                ) : isEdit ? null : (
                  <span className="text-ink-4 hidden sm:inline">
                    {translate('adminPagesCopy.m393')}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
                {addedCount > 0 ? 'Xong' : translate('adminPagesCopy.m137')}
              </Button>
              {isEdit ? (
                <Button variant="clay" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Spinner /> : null}
                  <span>{translate('adminPagesCopy.m394')}</span>
                </Button>
              ) : (
                <>
                  <Button variant="soft" size="sm" onClick={handleSave} disabled={saving}>
                    {translate('adminPagesCopy.m395')}
                  </Button>
                  <Button
                    variant="clay"
                    size="sm"
                    onClick={(e) => void handleSave(e, true)}
                    disabled={saving}
                  >
                    {saving ? <Spinner /> : null}
                    <span>{translate('adminPagesCopy.m396')}</span>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </AdminModal>
    )
  }
  return null
}
