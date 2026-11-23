'use client'
import {
  lib_docStatus_DOC_STATUS_LABELS as DOC_STATUS_LABELS,
  store_docs_STORAGE_QUOTA as STORAGE_QUOTA,
  lib_docStatus_docStatus as docStatus,
  store_docs_formatBytes as formatBytes,
} from '@workspace-engine'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import {
  FileText,
  FolderOpen,
  Grid2x2,
  List,
  MoreHorizontal,
  Presentation,
  Search,
  X,
} from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { MyDocsModel } from '@/modules/workspace/hooks'
import { relativeUpdatedAt } from '@/modules/workspace/hooks/my-docs-model'

import type { MyDocsParts } from '@/modules/workspace/containers/my-docs-container'
import type { SortKey } from '@/modules/workspace/hooks/my-docs-model'
import type { lib_docStatus_DocStatus as DocStatus } from '@workspace-engine'
const { SORTS, STATUS_STYLES } = MyDocsModel
export function MyDocsFilterSelectUi(
  props: ReturnType<typeof MyDocsModel.useFilterSelectContainer> & {
    parts: typeof MyDocsParts
  },
) {
  if (props.viewState === 0) {
    const { value, onChange, label, options } = props
    return (
      <Select value={value} onValueChange={onChange} items={options}>
        <SelectTrigger
          aria-label={label}
          className="h-9 w-auto max-w-56 min-w-32 shrink-0 gap-3 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return null
}
export function MyDocsItemMenuUi(
  props: ReturnType<typeof MyDocsModel.useItemMenuContainer> & {
    parts: typeof MyDocsParts
  },
) {
  if (props.viewState === 0) {
    const { item, actions, onStatusChange } = props
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-ink-3 relative z-10 size-8 shrink-0 rounded-lg"
            aria-label={t('workspaceCopy.m15', { value0: item.doc.title })}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions
            .filter((action) => !action.danger)
            .map((action) => (
              <DropdownMenuItem key={action.label} onSelect={action.fn}>
                <action.icon className="size-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('workspaceCopy.m16')}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={docStatus(item.doc.status)}
                onValueChange={(value) => onStatusChange(docStatus(value))}
              >
                {(Object.keys(DOC_STATUS_LABELS) as DocStatus[]).map((value) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {DOC_STATUS_LABELS[value]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {actions
            .filter((action) => action.danger)
            .map((action) => (
              <DropdownMenuItem key={action.label} variant="destructive" onSelect={action.fn}>
                <action.icon className="size-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return null
}
export function MyDocsUi(
  props: ReturnType<typeof MyDocsModel.useMyDocsContainer> & {
    parts: typeof MyDocsParts
  },
) {
  const { FilterSelect, ItemMenu } = props.parts
  if (props.viewState === 0) {
    const {
      tab,
      setTab,
      myDocs,
      myDecks,
      openEditor,
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
    } = props
    return (
      <TooltipProvider delayDuration={250}>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value === 'slide' ? 'slide' : 'exam')}
          className="mx-auto max-w-[1180px] min-w-0 px-4 py-8 sm:px-6 sm:py-12"
        >
          <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow mb-2">{t('workspaceCopy.m17')}</p>
              <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('workspaceCopy.m18')}
              </h1>
              <p className="text-ink-3 mt-2 text-sm">
                <span className="tnum text-ink font-semibold">{myDocs.length}</span>
                {t('workspaceCopy.m19')}
                <span className="tnum text-ink font-semibold">{myDecks.length}</span>
                {t('workspaceCopy.m20')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openEditor}>
                <Presentation className="size-4" />
                {t('workspaceCopy.m21')}
              </Button>
              <Button onClick={openEditor}>
                <FileText className="size-4" />
                {t('workspaceCopy.m22')}
              </Button>
            </div>
          </header>
          <div className="border-line bg-surface mb-6 rounded-xl border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-ink-2 font-medium">{t('workspaceCopy.m23')}</span>
              <span className="tnum text-ink-3">
                {formatBytes(used)}
                {t('workspaceCopy.m24')}
                {formatBytes(STORAGE_QUOTA)}
              </span>
            </div>
            <div className="bg-sunken mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all motion-reduce:transition-none',
                  pct > 90 ? 'bg-clay' : pct > 70 ? 'bg-honey' : 'bg-sage',
                )}
                style={{ width: `${Math.max(1.5, pct)}%` }}
              />
            </div>
            <p className="text-ink-3 mt-1.5 text-[11px]">{t('workspaceCopy.m25')}</p>
          </div>
          <section aria-label={t('workspaceCopy.m26')} className="mb-6 min-w-0 space-y-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <TabsList aria-label={t('workspaceCopy.m27')}>
                <TabsTrigger value="exam">{t('workspaceCopy.m28')}</TabsTrigger>
                <TabsTrigger value="slide">{t('workspaceCopy.m29')}</TabsTrigger>
              </TabsList>
              <div className="relative min-w-0 flex-1 basis-44 sm:ml-auto sm:max-w-72">
                <Search className="text-ink-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  aria-label={t('workspaceCopy.m30')}
                  placeholder={t('workspaceCopy.m31')}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <div className="border-line bg-surface flex shrink-0 items-center rounded-lg border p-0.5">
                {(
                  [
                    { id: 'grid', icon: Grid2x2, label: t('workspaceCopy.m32') },
                    { id: 'list', icon: List, label: t('workspaceCopy.m33') },
                  ] as const
                ).map(({ id, icon: Icon, label }) => (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={label}
                        aria-pressed={view === id}
                        onClick={() => setView(id)}
                        className={cn(
                          'size-8 rounded-md',
                          view === id ? 'bg-sunken text-clay' : 'text-ink-3',
                        )}
                      >
                        <Icon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              <FilterSelect
                label={t('workspaceCopy.m34')}
                value={status}
                onChange={(value) => setStatus(value === 'all' ? 'all' : docStatus(value))}
                options={[
                  { value: 'all', label: t('workspaceCopy.m35') },
                  ...Object.entries(DOC_STATUS_LABELS).map(([value, label]) => ({ value, label })),
                ]}
              />
              {tab === 'exam' && (
                <>
                  <FilterSelect
                    label={t('workspaceCopy.m36')}
                    value={subject ? `value:${subject}` : 'all'}
                    onChange={(value) => setSubject(value === 'all' ? '' : value.slice(6))}
                    options={[
                      { value: 'all', label: t('workspaceCopy.m37') },
                      ...subjects.map((value) => ({ value: `value:${value}`, label: value })),
                    ]}
                  />
                  <FilterSelect
                    label={t('workspaceCopy.m38')}
                    value={grade ? `value:${grade}` : 'all'}
                    onChange={(value) => setGrade(value === 'all' ? '' : value.slice(6))}
                    options={[
                      { value: 'all', label: t('workspaceCopy.m39') },
                      ...grades.map((value) => ({ value: `value:${value}`, label: value })),
                    ]}
                  />
                </>
              )}
              <div className="ml-auto shrink-0">
                <FilterSelect
                  label={t('workspaceCopy.m40')}
                  value={sort}
                  onChange={(value) => setSort(value as SortKey)}
                  options={SORTS.map(({ key, label }) => ({ value: key, label }))}
                />
              </div>
            </div>
            {chips.length > 0 && (
              <div
                aria-label={t('workspaceCopy.m41')}
                className="flex flex-wrap items-center gap-2"
              >
                {chips.map((chip) => (
                  <Badge
                    key={chip.id}
                    variant="outline"
                    className="bg-surface max-w-full gap-1.5 py-1 pr-1 pl-2.5 text-xs font-medium"
                  >
                    <span className="truncate">{chip.label}</span>
                    <button
                      type="button"
                      aria-label={t('workspaceCopy.m42', { value0: chip.label })}
                      onClick={chip.remove}
                      className="hover:bg-sunken shrink-0 rounded-sm p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-ink-3 h-7 text-xs"
                >
                  {t('workspaceCopy.m43')}
                </Button>
              </div>
            )}
          </section>
          <TabsContent
            value={tab}
            className="mt-0"
            aria-label={tab === 'exam' ? t('workspaceCopy.m44') : t('workspaceCopy.m45')}
            aria-busy={!hydrated}
          >
            {hydrated ? (
              items.length === 0 ? (
                <EmptyState
                  icon={
                    tab === 'exam' ? (
                      <FolderOpen className="size-7" strokeWidth={1.4} />
                    ) : (
                      <Presentation className="size-7" strokeWidth={1.4} />
                    )
                  }
                  title={
                    chips.length > 0
                      ? t('workspaceCopy.m47')
                      : tab === 'exam'
                        ? t('workspaceCopy.m48')
                        : t('workspaceCopy.m49')
                  }
                  description={
                    chips.length > 0
                      ? t('workspaceCopy.m50')
                      : tab === 'exam'
                        ? t('workspaceCopy.m51')
                        : t('workspaceCopy.m52')
                  }
                  action={
                    chips.length > 0 ? (
                      <Button variant="outline" onClick={reset}>
                        {t('workspaceCopy.m43')}
                      </Button>
                    ) : (
                      <Button onClick={openEditor}>
                        {tab === 'exam' ? t('workspaceCopy.m22') : t('workspaceCopy.m21')}
                      </Button>
                    )
                  }
                />
              ) : (
                <div
                  className={
                    view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'
                  }
                >
                  {items.map((item) => {
                    const d = item.doc
                    const Icon = item.kind === 'exam' ? FileText : Presentation
                    const currentStatus = docStatus(d.status)
                    const open = () => openItem(item)
                    const actions = actionsFor(item)
                    const counts =
                      item.kind === 'exam'
                        ? t('workspaceCopy.m53', {
                            value0: String(
                              item.doc.blocks.filter((b) => b.type === 'question').length,
                            ),
                            value1: String(
                              item.doc.blocks.filter((b) => b.type === 'essay').length,
                            ),
                          })
                        : `${item.doc.slides.length} slide`
                    return (
                      <Card
                        key={`${item.kind}-${d.id}`}
                        data-doc-id={d.id}
                        asChild
                        className={cn(
                          'group hover:border-clay/25 hover:shadow-lift relative min-w-0 rounded-xl shadow-none transition-[transform,box-shadow,border-color] motion-reduce:transition-none',
                          view === 'grid'
                            ? 'hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
                            : 'flex items-center gap-3 p-3 sm:gap-4 sm:px-4',
                        )}
                      >
                        <article>
                          <button
                            type="button"
                            aria-label={t('workspaceCopy.m54', { value0: d.title })}
                            onClick={open}
                            className="absolute inset-0 z-0 rounded-xl outline-offset-2"
                          />
                          <div
                            className={cn(
                              'bg-sunken text-clay pointer-events-none relative flex items-center justify-center rounded-lg',
                              view === 'grid' ? 'mx-4 mt-4 h-28' : 'size-10 shrink-0',
                            )}
                          >
                            <Icon
                              className={view === 'grid' ? 'size-10' : 'size-5'}
                              strokeWidth={1.4}
                            />
                          </div>
                          <div
                            className={cn(
                              'pointer-events-none relative min-w-0',
                              view === 'grid'
                                ? 'p-4'
                                : 'flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2',
                            )}
                          >
                            <div className={view === 'grid' ? '' : 'min-w-0 flex-1 basis-40'}>
                              <h2 className="text-ink line-clamp-2 text-sm leading-5 font-semibold">
                                {d.title}
                              </h2>
                              <p className="text-ink-3 mt-1 text-xs">{counts}</p>
                              {item.kind === 'exam' && (item.doc.subject || item.doc.grade) && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {item.doc.subject && (
                                    <Badge
                                      variant="secondary"
                                      className="max-w-full truncate text-[10px] font-medium"
                                    >
                                      {item.doc.subject}
                                    </Badge>
                                  )}
                                  {item.doc.grade && (
                                    <Badge variant="secondary" className="text-[10px] font-medium">
                                      {t('workspaceCopy.m55')}
                                      {item.doc.grade}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                'flex flex-wrap items-center gap-2',
                                view === 'grid'
                                  ? 'mt-4 justify-between'
                                  : 'basis-full justify-between sm:basis-auto sm:gap-5',
                              )}
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  'shrink-0 text-[10px] font-medium',
                                  STATUS_STYLES[currentStatus],
                                )}
                              >
                                {DOC_STATUS_LABELS[currentStatus]}
                              </Badge>
                              <time
                                dateTime={d.updatedAt}
                                title={t('workspaceCopy.m56', {
                                  value0: new Date(d.updatedAt).toLocaleString('vi-VN'),
                                })}
                                className="text-ink-3 text-[11px]"
                              >
                                {relativeUpdatedAt(d.updatedAt)}
                              </time>
                            </div>
                          </div>
                          <div
                            className={
                              view === 'grid'
                                ? 'absolute top-5 right-5'
                                : 'shrink-0 self-start sm:self-center'
                            }
                          >
                            <ItemMenu
                              item={item}
                              actions={actions}
                              onStatusChange={(value) => changeStatus(item, value)}
                            />
                          </div>
                        </article>
                      </Card>
                    )
                  })}
                </div>
              )
            ) : (
              <div
                role="status"
                aria-label={t('workspaceCopy.m46')}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map((key) => (
                  <Card key={key} className="space-y-4 p-5">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    )
  }
  return null
}
