'use client'
import { components_appIcons_TrashIcon as TrashIcon } from '@admin-pages-engine'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { AlertTriangle, Check, Eye, FileText, HardDrive, RefreshCw, Search, X } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  DropdownMenuItem,
  EmptyState,
  PageHeader,
  Pager,
  Segmented,
  SiteSelect,
  Spinner,
  Toolbar,
  inputClass,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t as translate } from '@/i18n/translate'
import {
  AdminDrawer,
  AdminRowActions,
  AdminTable,
} from '@/modules/admin-pages/components/admin-primitives-ui'
import { ContentPanelModel } from '@/modules/admin-pages/hooks'
import { formatViDate, formatViDateTime, shortenId } from '@/modules/admin-pages/hooks/admin-utils'

import type {
  ContentPanelParts as Imported0,
  ContentPanelParts as Imported1,
  ContentPanelParts as Imported2,
  ContentPanelParts as Imported3,
  ContentPanelParts as Imported4,
  ContentPanelParts as Imported5,
} from '@/modules/admin-pages/containers/content-panel-container/content-panel-container'
const { formatBytes, SUBJECT_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } = ContentPanelModel
export function ContentPanelContentPanelUi(
  props: ReturnType<typeof ContentPanelModel.useContentPanelContainer> & {
    parts: typeof Imported0
  },
) {
  const { ExamsTab, ReportsTab, DocsTab, FeedbackTab } = props.parts
  if (props.viewState === 0) {
    const { tab, setTab, tabOptions, me, isMod } = props
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <PageHeader title={translate('adminPagesCopy.m7')} className="mb-0 [&_h1]:text-2xl" />
          </div>

          <Segmented
            value={tab}
            onChange={(val) => setTab(val)}
            options={tabOptions}
            label={translate('adminPagesCopy.m200')}
            className="self-start"
          />
        </div>

        <div key={tab} className="anim-tab-in">
          {tab === 'exams' && <ExamsTab me={me} />}
          {tab === 'reports' && <ReportsTab me={me} />}
          {tab === 'docs' && !isMod && <DocsTab me={me} />}
          {tab === 'feedback' && !isMod && <FeedbackTab me={me} />}
        </div>
      </div>
    )
  }
  return null
}
export function ContentPanelExamsTabUi(
  props: ReturnType<typeof ContentPanelModel.useExamsTabContainer> & {
    parts: typeof Imported1
  },
) {
  const { ExamDrawer } = props.parts
  if (props.viewState === 0) {
    const {
      search,
      setSearch,
      subjectFilter,
      setSubjectFilter,
      setPage,
      statusFilter,
      setStatusFilter,
      loadExams,
      loading,
      exams,
      setSelectedExam,
      totalPages,
      page,
      selectedExam,
      me,
    } = props
    return (
      <div className="space-y-4">
        <Toolbar className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 lg:flex">
          <div className="relative min-w-0 lg:flex-1">
            <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translate('adminPagesCopy.m201')}
              className={`${inputClass} h-11 pr-9 pl-9 text-[13.5px]`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-4 hover:bg-sunken hover:text-ink absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1"
                aria-label={translate('adminPagesCopy.m58')}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <SiteSelect
            label={translate('adminPagesCopy.m202')}
            value={subjectFilter}
            options={SUBJECT_FILTER_OPTIONS}
            onChange={(v) => {
              setSubjectFilter(v)
              setPage(1)
            }}
            className="col-span-2 min-w-0 lg:w-[180px]"
          />
          <SiteSelect
            label={translate('adminPagesCopy.m203')}
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
            className="col-span-2 min-w-0 lg:w-[200px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadExams()}
            data-tip={translate('adminPagesCopy.m204')}
            aria-label={translate('adminPagesCopy.m204')}
            className="col-start-2 row-start-1 h-11 w-11 lg:order-last"
          >
            <RefreshCw className="size-4" />
          </Button>
        </Toolbar>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="max-h-[65vh] overflow-auto overscroll-contain">
            <AdminTable className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
              <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m205')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m206')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m207')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m60')}</th>
                  <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m208')}</th>
                  <th className="px-4 py-3 text-center">{translate('adminPagesCopy.m64')}</th>
                  <th className="px-4 py-3 text-center">{translate('adminPagesCopy.m209')}</th>
                  <th aria-label={translate('adminPagesCopy.m66')} />
                </tr>
              </thead>
              <tbody className="divide-line-2 divide-y">
                {loading && exams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-ink-3 py-16 text-center">
                      <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                      <span>{translate('adminPagesCopy.m210')}</span>
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <EmptyState
                        title={translate('adminPagesCopy.m211')}
                        description={translate('adminPagesCopy.m212')}
                      />
                    </td>
                  </tr>
                ) : (
                  exams.map((ex) => (
                    <tr
                      key={ex.id}
                      onClick={() => setSelectedExam(ex)}
                      className="hover:bg-sunken/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-[280px]">
                          <p className="text-ink truncate font-semibold" data-tip={ex.title}>
                            {ex.title}
                          </p>
                          {ex.school ? (
                            <p className="text-ink-3 truncate text-[12px]">{ex.school}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-ink-2 px-4 py-3 whitespace-nowrap">
                        <span className="text-ink font-medium">{ex.subject}</span>
                        {ex.grade ? (
                          <span className="text-ink-3">
                            {translate('adminPagesCopy.m213')}
                            {ex.grade}
                          </span>
                        ) : null}
                      </td>
                      <td className="text-ink-3 px-4 py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-[12px]"
                          data-tip={ex.ownerEmail ?? ex.ownerId ?? ''}
                        >
                          {ex.ownerEmail ||
                            (ex.ownerId ? shortenId(ex.ownerId) : translate('adminPagesCopy.m214'))}
                        </span>
                      </td>
                      <td className="text-ink-3 px-4 py-3 text-[12.5px] whitespace-nowrap">
                        {formatViDate(ex.createdAt)}
                      </td>
                      <td className="text-ink tnum px-4 py-3 text-right font-medium whitespace-nowrap">
                        {ex.questionCount}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {ex.status === 'published' ? (
                          <Badge tone="sage">{translate('adminPagesCopy.m159')}</Badge>
                        ) : ex.status === 'hidden' ? (
                          <Badge tone="honey">{translate('adminPagesCopy.m160')}</Badge>
                        ) : (
                          <Badge tone="clay">{translate('adminPagesCopy.m161')}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {ex.openReports > 0 ? (
                          <Badge tone="clay" className="inline-flex items-center gap-1 font-bold">
                            <AlertTriangle className="size-3" />
                            <span>{ex.openReports}</span>
                          </Badge>
                        ) : (
                          <span className="text-ink-4">{translate('adminPagesCopy.m215')}</span>
                        )}
                      </td>
                      <td>
                        <AdminRowActions>
                          <DropdownMenuItem onSelect={() => setSelectedExam(ex)}>
                            {translate('adminPagesCopy.m216')}
                          </DropdownMenuItem>
                        </AdminRowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminTable>
          </div>

          {totalPages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={totalPages} go={setPage} />
            </div>
          ) : null}
        </Card>

        {selectedExam ? (
          <ExamDrawer
            exam={selectedExam}
            me={me}
            onClose={() => setSelectedExam(null)}
            onUpdated={() => {
              void loadExams()
            }}
          />
        ) : null}
      </div>
    )
  }
  return null
}
export function ContentPanelExamDrawerUi(
  props: ReturnType<typeof ContentPanelModel.useExamDrawerContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    const {
      close,
      panelClass,
      exam,
      handleSetStatus,
      actionBusy,
      handleRemove,
      me,
      handleDelete,
      loadingDoc,
      questions,
    } = props
    return (
      <AdminDrawer
        onClose={close}
        className={cn(
          'border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l shadow-2xl sm:w-[540px] md:w-[640px]',
          panelClass,
        )}
        aria-label={translate('adminPagesCopy.m216')}
      >
        <div className="border-line flex items-center justify-between border-b px-6 py-4">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-ink truncate text-[16px] font-bold" data-tip={exam.title}>
                {exam.title}
              </h2>
              {exam.status === 'published' ? (
                <Badge tone="sage">{translate('adminPagesCopy.m159')}</Badge>
              ) : exam.status === 'hidden' ? (
                <Badge tone="honey">{translate('adminPagesCopy.m160')}</Badge>
              ) : (
                <Badge tone="clay">{translate('adminPagesCopy.m161')}</Badge>
              )}
            </div>
            <p className="text-ink-3 mt-0.5 truncate text-[12.5px]">
              {translate('adminPagesCopy.m217')}
              {exam.subject}
              {translate('adminPagesCopy.m213')}
              {exam.grade}
              {translate('adminPagesCopy.m213')}
              {exam.school || translate('adminPagesCopy.m218')}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5"
            aria-label={translate('adminPagesCopy.m136')}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-line-2 bg-sunken/40 flex flex-wrap items-center gap-2 border-b px-6 py-3">
          {exam.status === 'published' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSetStatus('hidden')}
                disabled={actionBusy}
              >
                {translate('adminPagesCopy.m160')}
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={() => void handleRemove()}
                disabled={actionBusy}
                className="text-clay hover:bg-clay-soft"
              >
                {translate('adminPagesCopy.m219')}
              </Button>
            </>
          ) : exam.status === 'hidden' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSetStatus('published')}
                disabled={actionBusy}
              >
                {translate('adminPagesCopy.m220')}
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={() => void handleRemove()}
                disabled={actionBusy}
                className="text-clay hover:bg-clay-soft"
              >
                {translate('adminPagesCopy.m219')}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSetStatus('published')}
              disabled={actionBusy}
            >
              {translate('adminPagesCopy.m221')}
            </Button>
          )}

          {me.role === 'admin' ? (
            <div className="ml-auto">
              <Button
                variant="clay"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={actionBusy}
              >
                <TrashIcon className="size-3.5" />
                <span>{translate('adminPagesCopy.m45')}</span>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-[13.5px]">
          {exam.status === 'removed' ? (
            <div className="border-clay/30 bg-clay-soft/40 text-clay rounded-[8px] border p-4 text-[13px]">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" />
                <span>{translate('adminPagesCopy.m222')}</span>
              </div>
              <p className="text-ink-2 mt-1">
                <strong>{translate('adminPagesCopy.m223')}</strong>{' '}
                {exam.removedReason || translate('adminPagesCopy.m224')}
              </p>
              {exam.moderatedAt ? (
                <p className="text-ink-3 mt-1 text-[11.5px]">
                  {translate('adminPagesCopy.m225')}
                  {formatViDateTime(exam.moderatedAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
              {translate('adminPagesCopy.m226')}
            </h3>
            <div className="border-line-2 bg-sunken/40 grid grid-cols-2 gap-3 rounded-[8px] border p-4">
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m207')}
                </span>
                <span className="text-ink font-mono text-[12px] font-medium">
                  {exam.ownerEmail ||
                    (exam.ownerId ? shortenId(exam.ownerId) : translate('adminPagesCopy.m214'))}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m60')}
                </span>
                <span className="text-ink font-medium">{formatViDateTime(exam.createdAt)}</span>
              </div>
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m227')}
                </span>
                <span className="text-ink font-medium">
                  {exam.durationMinutes}
                  {translate('adminPagesCopy.m228')}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m229')}
                </span>
                <span className="text-ink font-medium">
                  {exam.totalPoints}
                  {translate('adminPagesCopy.m107')}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m230')}
                </span>
                <span className="text-ink font-medium">
                  {exam.questionCount}
                  {translate('adminPagesCopy.m231')}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block text-[12px]">
                  {translate('adminPagesCopy.m232')}
                </span>
                <span className="text-ink font-medium">
                  {exam.openReports > 0 ? (
                    <span className="text-clay font-bold">
                      {exam.openReports}
                      {translate('adminPagesCopy.m233')}
                    </span>
                  ) : (
                    '0'
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
              {translate('adminPagesCopy.m234')}
            </h3>

            {loadingDoc ? (
              <div className="text-ink-3 flex items-center justify-center py-8">
                <Spinner className="mr-2" />
                <span>{translate('adminPagesCopy.m235')}</span>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="border-line bg-surface rounded-[8px] border p-4 text-[13px]"
                  >
                    <p className="text-ink font-semibold">
                      {translate('adminPagesCopy.m236')}
                      {idx + 1}
                      {translate('adminPagesCopy.m237')}
                      {q.prompt}
                    </p>
                    {Array.isArray(q.choices) ? (
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {q.choices.map((c: string, ci: number) => {
                          const letter = String.fromCodePoint(65 + ci)
                          const isCorrect = q.answer === letter || q.answer === c
                          return (
                            <div
                              key={letter}
                              className={`rounded-[4px] px-2.5 py-1 text-[12.5px] ${
                                isCorrect
                                  ? 'bg-sage-soft text-sage border-sage/30 border font-semibold'
                                  : 'bg-sunken text-ink-2'
                              }`}
                            >
                              <span className="mr-1 font-bold">
                                {letter}
                                {translate('adminPagesCopy.m238')}
                              </span>{' '}
                              {c}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-line-2 bg-sunken/40 rounded-[8px] border p-4">
                <p className="text-ink-2 font-medium">{translate('adminPagesCopy.m239')}</p>
                <p className="text-ink-3 mt-1">
                  {exam.preview || translate('adminPagesCopy.m240')}
                </p>
              </div>
            )}
          </section>
        </div>
      </AdminDrawer>
    )
  }
  return null
}
export function ContentPanelReportsTabUi(
  props: ReturnType<typeof ContentPanelModel.useReportsTabContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    const {
      setStatusFilter,
      setPage,
      statusFilter,
      loadReports,
      loading,
      reports,
      handleResolve,
      totalPages,
      page,
    } = props
    return (
      <div className="space-y-4">
        <div className="border-line bg-surface flex flex-wrap items-center justify-between gap-3 rounded-[8px] border p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-3 text-[13px] font-medium">
              {translate('adminPagesCopy.m241')}
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('open')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${statusFilter === 'open' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m242')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('resolved')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${statusFilter === 'resolved' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m243')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('dismissed')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${statusFilter === 'dismissed' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m244')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${statusFilter === '' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m245')}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadReports()}
            data-tip={translate('adminPagesCopy.m204')}
          >
            <RefreshCw className="size-3.5" />
            <span>{translate('adminPagesCopy.m204')}</span>
          </Button>
        </div>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="max-h-[65vh] overflow-auto overscroll-contain">
            <AdminTable className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
              <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m246')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m247')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m248')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m249')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m250')}</th>
                  <th className="px-4 py-3 text-center">{translate('adminPagesCopy.m64')}</th>
                  <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m251')}</th>
                </tr>
              </thead>
              <tbody className="divide-line-2 divide-y">
                {loading && reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-ink-3 py-16 text-center">
                      <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                      <span>{translate('adminPagesCopy.m252')}</span>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <EmptyState title={translate('adminPagesCopy.m253')} description="" />
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-sunken/40 transition-colors">
                      <td className="text-ink-3 px-4 py-3 text-[12px] whitespace-nowrap">
                        {formatViDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[220px]">
                          <p className="text-ink truncate font-semibold" data-tip={r.examTitle}>
                            {r.examTitle}
                          </p>
                          <a
                            href={appPaths.exams.getHref(r.examId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-clay inline-flex items-center gap-1 text-[11.5px] hover:underline"
                          >
                            <Eye className="size-3" />
                            <span>{translate('adminPagesCopy.m254')}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          tone={r.reason === translate('adminPagesCopy.m255') ? 'honey' : 'clay'}
                        >
                          {r.reason}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="text-ink-2 line-clamp-2 max-w-[260px] text-[12.5px]"
                          data-tip={r.detail || ''}
                        >
                          {r.detail || '—'}
                        </p>
                      </td>
                      <td className="text-ink-3 px-4 py-3 text-[12px] whitespace-nowrap">
                        {r.reporterEmail ||
                          (r.reporterId
                            ? shortenId(r.reporterId)
                            : translate('adminPagesCopy.m256'))}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.status === 'open' ? (
                          <Badge tone="clay">{translate('adminPagesCopy.m257')}</Badge>
                        ) : r.status === 'resolved' ? (
                          <Badge tone="sage">{translate('adminPagesCopy.m243')}</Badge>
                        ) : (
                          <Badge tone="neutral">{translate('adminPagesCopy.m244')}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.status === 'open' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => void handleResolve(r.id, 'resolved')}
                              className="text-[12px]"
                            >
                              <Check className="size-3" />
                              <span>{translate('adminPagesCopy.m243')}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleResolve(r.id, 'dismissed')}
                              className="text-[12px]"
                            >
                              {translate('adminPagesCopy.m258')}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-ink-4 text-[12px]">
                            {translate('adminPagesCopy.m259')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminTable>
          </div>

          {totalPages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={totalPages} go={setPage} />
            </div>
          ) : null}
        </Card>
      </div>
    )
  }
  return null
}
export function ContentPanelDocsTabUi(
  props: ReturnType<typeof ContentPanelModel.useDocsTabContainer> & {
    parts: typeof Imported4
  },
) {
  if (props.viewState === 0) {
    const {
      topUsers,
      search,
      setSearch,
      loadDocs,
      loading,
      docs,
      handleDelete,
      totalPages,
      page,
      setPage,
    } = props
    return (
      <div className="space-y-6">
        <Card className="border-line shadow-soft border p-5">
          <div className="flex items-center gap-2 pb-3">
            <HardDrive className="text-clay size-4.5" />
            <h2 className="text-ink text-[15px] font-bold">{translate('adminPagesCopy.m260')}</h2>
          </div>

          {topUsers.length === 0 ? (
            <p className="text-ink-3 text-[13px]">{translate('adminPagesCopy.m261')}</p>
          ) : (
            <div className="max-h-[65vh] overflow-auto overscroll-contain">
              <div className="flex gap-3 pt-1 pb-2">
                {topUsers.map((u, i) => (
                  <div
                    key={u.ownerId}
                    className="border-line-2 bg-sunken/40 flex min-w-[200px] shrink-0 flex-col justify-between rounded-[8px] border p-3 text-[12.5px]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-3 font-bold">
                          {translate('adminPagesCopy.m262')}
                          {i + 1}
                        </span>
                        <span className="text-clay font-semibold">{formatBytes(u.totalSize)}</span>
                      </div>
                      <p
                        className="text-ink mt-1 truncate font-medium"
                        data-tip={u.name || u.email}
                      >
                        {u.name || u.email}
                      </p>
                      <p className="text-ink-3 truncate text-[11px]">{u.email}</p>
                    </div>
                    <div className="border-line-2 text-ink-3 mt-2 border-t pt-1 text-[11px]">
                      {u.docCount}
                      {translate('adminPagesCopy.m263')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <div className="border-line bg-surface flex items-center gap-2.5 rounded-[8px] border p-3.5 shadow-xs">
            <div className="relative min-w-0 flex-1">
              <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate('adminPagesCopy.m264')}
                className={`${inputClass} h-11 pr-9 pl-9 text-[13.5px]`}
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-ink-4 hover:bg-sunken hover:text-ink absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1"
                  aria-label={translate('adminPagesCopy.m58')}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => void loadDocs()}
              data-tip={translate('adminPagesCopy.m204')}
              aria-label={translate('adminPagesCopy.m204')}
              className="h-11 w-11 shrink-0"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <Card className="border-line shadow-soft overflow-hidden border">
            <div className="max-h-[65vh] overflow-auto overscroll-contain">
              <AdminTable className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
                <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider uppercase">
                  <tr>
                    <th className="px-4 py-3">{translate('adminPagesCopy.m265')}</th>
                    <th className="px-4 py-3">{translate('adminPagesCopy.m266')}</th>
                    <th className="px-4 py-3">{translate('adminPagesCopy.m267')}</th>
                    <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m268')}</th>
                    <th className="px-4 py-3">{translate('adminPagesCopy.m269')}</th>
                    <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m66')}</th>
                  </tr>
                </thead>
                <tbody className="divide-line-2 divide-y">
                  {loading && docs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-ink-3 py-16 text-center">
                        <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                        <span>{translate('adminPagesCopy.m270')}</span>
                      </td>
                    </tr>
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <EmptyState title={translate('adminPagesCopy.m271')} description="" />
                      </td>
                    </tr>
                  ) : (
                    docs.map((d) => (
                      <tr key={d.id} className="hover:bg-sunken/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <FileText className="text-clay size-4 shrink-0" />
                            <div className="max-w-[280px]">
                              <p className="text-ink truncate font-semibold" data-tip={d.name}>
                                {d.name}
                              </p>
                              <span className="text-ink-3 font-mono text-[11px]">{d.mime}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-ink-2 px-4 py-3 text-[12.5px] whitespace-nowrap">
                          {d.ownerEmail}
                        </td>
                        <td className="text-ink-3 px-4 py-3 whitespace-nowrap">
                          {d.subject || '—'}
                        </td>
                        <td className="text-ink tnum px-4 py-3 text-right font-medium whitespace-nowrap">
                          {formatBytes(d.size)}
                        </td>
                        <td className="text-ink-3 px-4 py-3 text-[12px] whitespace-nowrap">
                          {formatViDate(d.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDelete(d)}
                            className="text-ink-3 hover:text-clay"
                            data-tip={translate('adminPagesCopy.m192')}
                            aria-label={translate('adminPagesCopy.m192')}
                          >
                            <TrashIcon className="size-3.5" />
                            <span className="hidden sm:inline">
                              {translate('adminPagesCopy.m272')}
                            </span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </AdminTable>
            </div>

            {totalPages > 1 ? (
              <div className="border-line border-t px-4 py-3">
                <Pager page={page} pages={totalPages} go={setPage} />
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    )
  }
  return null
}
export function ContentPanelFeedbackTabUi(
  props: ReturnType<typeof ContentPanelModel.useFeedbackTabContainer> & {
    parts: typeof Imported5
  },
) {
  if (props.viewState === 0) {
    const {
      setReadFilter,
      setPage,
      readFilter,
      loadFeedback,
      loading,
      feedback,
      handleToggleRead,
      totalPages,
      page,
    } = props
    return (
      <div className="space-y-4">
        <div className="border-line bg-surface flex flex-wrap items-center justify-between gap-3 rounded-[8px] border p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-3 text-[13px] font-medium whitespace-nowrap">
              {translate('adminPagesCopy.m241')}
            </span>
            <button
              type="button"
              onClick={() => {
                setReadFilter('all')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${readFilter === 'all' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m245')}
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter('unread')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${readFilter === 'unread' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m273')}
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter('read')
                setPage(1)
              }}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${readFilter === 'read' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'}`}
            >
              {translate('adminPagesCopy.m274')}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadFeedback()}
            data-tip={translate('adminPagesCopy.m204')}
          >
            <RefreshCw className="size-3.5" />
            <span>{translate('adminPagesCopy.m204')}</span>
          </Button>
        </div>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="divide-line-2 divide-y">
            {loading && feedback.length === 0 ? (
              <div className="text-ink-3 py-16 text-center">
                <Skeleton className="mx-auto inline-block h-5 w-24 align-middle" />
                <span>{translate('adminPagesCopy.m275')}</span>
              </div>
            ) : feedback.length === 0 ? (
              <div className="py-12 text-center">
                <EmptyState title={translate('adminPagesCopy.m276')} description="" />
              </div>
            ) : (
              feedback.map((f) => (
                <div
                  key={f.id}
                  className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${f.read ? 'hover:bg-sunken/40' : 'bg-clay-soft/15 hover:bg-clay-soft/25'}`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {f.read ? null : (
                        <span
                          className="bg-clay inline-block size-2 rounded-full"
                          data-tip={translate('adminPagesCopy.m273')}
                        />
                      )}
                      <span
                        className={`text-[13.5px] ${f.read ? 'text-ink-2 font-medium' : 'text-ink font-bold'}`}
                      >
                        {f.email || translate('adminPagesCopy.m277')}
                      </span>
                      {f.page ? (
                        <span className="bg-sunken text-ink-3 rounded px-2 py-0.5 font-mono text-[11px]">
                          {f.page}
                        </span>
                      ) : null}
                      <span className="text-ink-4 text-[12px]">
                        {formatViDateTime(f.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${f.read ? 'text-ink-2' : 'text-ink font-medium'}`}
                    >
                      {f.message}
                    </p>
                  </div>

                  <div className="shrink-0 pt-1 sm:pt-0">
                    <Button
                      variant={f.read ? 'outline' : 'soft'}
                      size="sm"
                      onClick={() => void handleToggleRead(f)}
                      className="text-[12px]"
                    >
                      {f.read ? (
                        <span>{translate('adminPagesCopy.m278')}</span>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          <span>{translate('adminPagesCopy.m274')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={totalPages} go={setPage} />
            </div>
          ) : null}
        </Card>
      </div>
    )
  }
  return null
}
