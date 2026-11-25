'use client'
import {
  lib_math_formatPoints as formatPoints,
  lib_attempts_isRemoteExamId as isRemoteExamId,
  Link,
  data_types_totalPoints as totalPoints,
} from '@student-engine'
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  Flag,
  MonitorPlay,
  Printer,
  Save,
  Sparkles,
  X,
} from 'lucide-react'

import { PageSkeleton } from '@/components/page-skeleton'
import {
  SiteBadge as Badge,
  SiteButton as Button,
  EmptyState,
  inputClass,
  PageHeader,
  SiteSelect,
} from '@/components/product-ui'
import { A4_PORTRAIT_W, ExamEditor } from '@/components/student-kernel'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-student'

import type {
  ExamViewParts as Imported0,
  ExamViewParts as Imported1,
  ExamViewParts as Imported2,
  ExamViewParts as Imported3,
} from '@/modules/student-exams/containers/exam-view-container/exam-view-container'
import type { ExamViewModel } from '@/modules/student-exams/hooks'

export function ExamViewUi(
  props: ReturnType<typeof ExamViewModel.useExamViewContainer> & {
    parts: typeof Imported0
  },
) {
  const { SaveMenu, DocView, ReportExamButton } = props.parts
  if (props.viewState === 2) return <PageSkeleton variant="detail" />
  if (props.viewState === 0) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          title={t('studentCopy.m378')}
          description={props.error ?? t('studentCopy.m379')}
          action={
            <Link to={appPaths.community.href}>
              <Button variant="primary">{t('studentCopy.m364')}</Button>
            </Link>
          }
        />
      </div>
    )
  }
  if (props.viewState === 1) {
    const { exam, handleInteractive, id, print, download } = props
    return (
      <div className="print-root bg-sunken/35">
        <div className="no-print border-line/70 bg-canvas/88 sticky top-[68px] z-30 border-b backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-[1180px] flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6">
            <Link
              to={appPaths.community.href}
              className="bg-cream text-ink-2 shadow-soft hover:text-ink flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>

            {props.serverSummary ? (
              <p className="min-w-0 flex-1 text-sm text-slate-600">
                {exam.sections.reduce((n, s) => n + s.questions.length, 0)} câu hỏi ·{' '}
                {exam.durationMinutes} phút
              </p>
            ) : (
              <PageHeader
                className="mb-0 min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-64 [&_h1]:text-base [&_h1]:leading-snug [&_header]:mb-0"
                title={exam.title}
                count={
                  <>
                    {exam.sections.reduce((n, s) => n + s.questions.length, 0)}
                    {t('studentCopy.m380')} {formatPoints(totalPoints(exam))}
                    {t('studentCopy.m381')}
                    {exam.durationMinutes}
                    {t('studentCopy.m382')}
                  </>
                }
              />
            )}

            <Badge tone="neutral" className="hidden shrink-0 sm:inline-flex">
              {exam.subject}
            </Badge>

            <SaveMenu exam={exam} />

            <Button variant="soft" size="sm" aria-label={t('studentCopy.m383')} onClick={print}>
              <Printer className="size-3.5" />
              <span className="hidden md:inline">{t('studentCopy.m383')}</span>
            </Button>

            <Button
              variant="soft"
              size="sm"
              aria-label={t('studentCopy.m384')}
              onClick={() => void download()}
            >
              <Download className="size-3.5" />
              <span className="hidden md:inline">{t('studentCopy.m384')}</span>
            </Button>

            <Button variant="clay" size="sm" onClick={handleInteractive}>
              <MonitorPlay className="size-3.5" />
              <span className="hidden sm:inline">{t('studentCopy.m385')}</span>
              <span className="sm:hidden">{t('studentCopy.m57')}</span>
            </Button>

            {id && isRemoteExamId(id) ? <ReportExamButton examId={id} /> : null}
          </div>
        </div>

        <div className="px-4 py-8 sm:px-6">
          <DocView exam={exam} />
        </div>
      </div>
    )
  }
  return null
}
export function ExamViewSaveMenuUi(
  props: ReturnType<typeof ExamViewModel.useSaveMenuContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const { ref, setOpen, open, busy, item, toOnline, toEditor } = props
    return (
      <div ref={ref} className="relative">
        <Button
          variant="soft"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-label={busy ? t('studentCopy.m386') : t('studentCopy.m387')}
          aria-expanded={open}
          disabled={busy}
        >
          <Save className="size-3.5" />
          <span className="hidden md:inline">
            {busy ? t('studentCopy.m386') : t('studentCopy.m387')}
          </span>
          <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
        {open ? (
          <div
            role="menu"
            className="anim-sheet bg-surface shadow-float absolute top-full left-0 z-40 mt-2 w-[280px] rounded-[8px] p-1.5 sm:right-0 sm:left-auto"
          >
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false)
                toOnline()
              }}
            >
              <Sparkles className="text-clay mt-0.5 size-4 shrink-0" />
              <span>
                <span className="text-ink block text-[13.5px] font-semibold">
                  {t('studentCopy.m388')}
                </span>
                <span className="text-ink-3 block text-[12px]">{t('studentCopy.m389')}</span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={busy}
              onClick={() => {
                setOpen(false)
                void toEditor()
              }}
            >
              <FileText className="text-clay mt-0.5 size-4 shrink-0" />
              <span>
                <span className="text-ink block text-[13.5px] font-semibold">
                  {t('studentCopy.m390')}
                </span>
                <span className="text-ink-3 block text-[12px]">{t('studentCopy.m391')}</span>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    )
  }
  return null
}
export function ExamViewDocViewUi(
  props: ReturnType<typeof ExamViewModel.useDocViewContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    const { boxRef, content, zoom } = props
    return (
      <div ref={boxRef} className="flex justify-center">
        {content ? (
          <div style={{ zoom, width: A4_PORTRAIT_W }}>
            <ExamEditor content={content} onChange={() => {}} readOnly />
          </div>
        ) : (
          <div className="bg-surface h-[1123px] w-full max-w-[794px] animate-pulse rounded-[4px]" />
        )}
      </div>
    )
  }
  return null
}
export function ExamViewReportExamButtonUi(
  props: ReturnType<typeof ExamViewModel.useReportExamButtonContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    const {
      handleOpen,
      open,
      setOpen,
      handleSubmit,
      reason,
      setReason,
      detail,
      setDetail,
      submitting,
    } = props
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          data-tip={t('studentCopy.m392')}
          aria-label={t('studentCopy.m392')}
          className="text-ink-4 hover:text-clay"
        >
          <Flag className="size-3.5" />
          <span className="hidden xl:inline">{t('studentCopy.m393')}</span>
        </Button>

        {open ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              showCloseButton={false}
              aria-describedby={undefined}
              className="border-line bg-surface shadow-float anim-pop block w-[calc(100%-2rem)] max-w-md rounded-[10px] border p-6 ring-0"
            >
              <div className="border-line flex items-center justify-between border-b pb-3">
                <DialogTitle className="font-display text-ink text-[16px] font-bold">
                  {t('studentCopy.m394')}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-ink-3 hover:bg-sunken hover:text-ink rounded-full p-1"
                  aria-label={t('studentCopy.m329')}
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-[13.5px]">
                <div>
                  <label className="text-ink-2 mb-1 block font-medium">
                    {t('studentCopy.m395')}
                  </label>
                  <SiteSelect
                    label={t('studentCopy.m395')}
                    value={reason}
                    options={[
                      t('studentCopy.m371'),
                      t('studentCopy.m396'),
                      'Spam',
                      t('studentCopy.m397'),
                      t('studentCopy.m398'),
                    ].map((r) => ({ value: r, label: r }))}
                    onChange={setReason}
                  />
                </div>

                <div>
                  <label className="text-ink-2 mb-1 block font-medium">
                    {t('studentCopy.m399')}
                    <span className="text-ink-4 font-normal">{t('studentCopy.m400')}</span>
                  </label>
                  <textarea
                    aria-label={t('studentCopy.m399')}
                    rows={4}
                    maxLength={1000}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={t('studentCopy.m401')}
                    className={`${inputClass} w-full resize-none py-2`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    {t('studentCopy.m69')}
                  </Button>
                  <Button type="submit" variant="clay" size="sm" disabled={submitting}>
                    {submitting ? t('studentCopy.m402') : t('studentCopy.m403')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </>
    )
  }
  return null
}
