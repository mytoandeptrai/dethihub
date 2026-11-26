'use client'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Camera, CheckCircle2, ClipboardList, ScanLine, XCircle } from 'lucide-react'
import Image from 'next/image'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  inputClass,
  PageHeader,
  PageShell,
  SiteSelect,
} from '@/components/product-ui'
import { t } from '@/i18n/translate-workspace'
import { GradingModel } from '@/modules/workspace/hooks'

import type { GradingParts } from '@/modules/workspace/containers/grading-container'
const { KEYS } = GradingModel
export function GradingUi(
  props: ReturnType<typeof GradingModel.useGradingContainer> & {
    parts: typeof GradingParts
  },
) {
  const { Stat } = props.parts
  if (props.viewState === 0) {
    const {
      keyLetters,
      questions,
      selectedKey,
      setSelectedKey,
      studentName,
      setStudentName,
      studentCode,
      setStudentCode,
      fileRef,
      image,
      handleFile,
      scanning,
      answers,
      result,
      grade,
      reset,
      toggleAnswer,
      error,
    } = props
    return (
      <PageShell>
        <PageHeader
          eyebrow={t('workspaceCopy.m471')}
          title={t('workspaceCopy.m472')}
          count={
            <>
              {keyLetters.length}
              {t('workspaceCopy.m65')}
            </>
          }
          description=""
        />

        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4 lg:sticky lg:top-24">
            <Card className="rounded-xl p-5">
              <p className="eyebrow mb-4">{t('workspaceCopy.m473')}</p>

              <label className="mb-4 block">
                <span className="text-ink-2 mb-2 block text-[12.5px] font-semibold">
                  {t('workspaceCopy.m474')}
                </span>
                <SiteSelect
                  label={t('workspaceCopy.m474')}
                  options={KEYS.map((key) => ({ value: key.id, label: key.label }))}
                  value={selectedKey}
                  onChange={setSelectedKey}
                  className="w-full"
                />
              </label>

              <label className="mb-4 block">
                <span className="text-ink-2 mb-2 block text-[12.5px] font-semibold">
                  {t('workspaceCopy.m250')}
                </span>
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t('workspaceCopy.m475')}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-ink-2 mb-2 block text-[12.5px] font-semibold">
                  {t('workspaceCopy.m476')}
                </span>
                <input
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder={t('workspaceCopy.m477')}
                  className={inputClass}
                />
              </label>
            </Card>

            <Card className="rounded-xl p-5">
              <p className="eyebrow mb-4">{t('workspaceCopy.m478')}</p>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-sunken/60 hover:bg-sunken flex w-full flex-col items-center gap-2.5 rounded-[10px] px-4 py-9 text-center transition-colors"
              >
                {image ? (
                  <Image
                    unoptimized
                    width={1024}
                    height={1024}
                    style={{ width: 'auto', height: 'auto' }}
                    src={image}
                    alt={t('workspaceCopy.m479')}
                    className="max-h-40 rounded-[10px] object-contain"
                  />
                ) : (
                  <>
                    <span className="bg-surface text-ink-3 shadow-soft flex size-11 items-center justify-center rounded-full">
                      <Camera className="size-4.5" strokeWidth={1.7} />
                    </span>
                    <span className="text-ink-2 text-[13px] font-semibold">
                      {t('workspaceCopy.m480')}
                    </span>
                    <span className="text-ink-4 text-[11.5px]">{t('workspaceCopy.m481')}</span>
                  </>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />

              {error && (
                <p role="alert" className="text-clay mt-3.5 text-[12.5px]">
                  {error}
                </p>
              )}
              {scanning ? (
                <div className="bg-sunken text-ink-2 mt-3.5 flex items-center gap-2.5 rounded-[6px] px-3.5 py-2.5 text-[12.5px] font-medium">
                  <ScanLine className="text-clay size-3.5 animate-pulse" />
                  {t('workspaceCopy.m482')}
                </div>
              ) : null}

              {answers.length > 0 ? (
                <p className="text-ink-3 mt-3.5 text-[12px] leading-relaxed">
                  {t('workspaceCopy.m483')}
                  {answers.filter(Boolean).length}
                  {t('workspaceCopy.m263')}
                  {keyLetters.length}
                  {t('workspaceCopy.m484')}
                </p>
              ) : null}
            </Card>
          </div>

          <Card className="min-w-0 rounded-xl p-4 sm:p-6">
            <div className="border-line mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <p className="eyebrow">{t('workspaceCopy.m479')}</p>
              {result ? (
                <Badge tone="sage">
                  {studentName || t('workspaceCopy.m250')}
                  {t('workspaceCopy.m485')}
                  {result.correct}
                  {t('workspaceCopy.m263')}
                  {result.total}
                  {t('workspaceCopy.m486')}
                </Badge>
              ) : null}
            </div>

            {scanning ? (
              <div role="status" aria-label={t('workspaceCopy.m482')} className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : keyLetters.length > 0 ? (
              <>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {questions.map(({ id, index: i }) => {
                    const picked = answers[i] ?? ''
                    const isRight = result?.details[i]?.ok
                    const isWrong = result && !isRight && picked
                    return (
                      <div key={id} className="text-center">
                        <span className="eyebrow tnum mb-1.5 block">{i + 1}</span>
                        <div
                          className={cn(
                            'flex h-9 items-center justify-center rounded-[5px] border text-[12.5px] font-bold transition-colors',
                            isRight
                              ? 'border-sage bg-sage text-white'
                              : isWrong
                                ? 'border-clay bg-clay text-white'
                                : picked
                                  ? 'border-ink bg-ink text-paper'
                                  : 'border-line-2 text-ink-4 bg-white',
                          )}
                        >
                          {picked || '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <p className="eyebrow mb-3">{t('workspaceCopy.m487')}</p>
                  <div className="flex flex-wrap gap-2">
                    {questions.map(({ id, index: i }) => (
                      <div key={id} className="flex items-center gap-1">
                        <span className="eyebrow tnum w-4 text-right max-[359px]:w-4 sm:w-5">
                          {i + 1}
                        </span>
                        {(['A', 'B', 'C', 'D'] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => toggleAnswer(i, l)}
                            className={cn(
                              'size-7 rounded-[9px] border text-[11.5px] font-bold transition-colors max-[359px]:size-9',
                              answers[i] === l
                                ? 'border-ink bg-ink text-paper'
                                : 'border-line-2 text-ink-3 hover:border-ink-4 bg-white',
                            )}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Button variant="clay" onClick={grade}>
                    <CheckCircle2 className="size-4" />
                    {t('workspaceCopy.m488')}
                  </Button>
                  <Button variant="soft" onClick={reset}>
                    {t('workspaceCopy.m489')}
                  </Button>
                </div>

                {result ? (
                  <div className="border-line-2 anim-rise mt-7 border-t pt-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Stat label={t('workspaceCopy.m212')} value={`${result.score}`} tone="ink" />
                      <Stat
                        label={t('workspaceCopy.m187')}
                        value={`${result.correct}`}
                        tone="sage"
                      />
                      <Stat
                        label={t('workspaceCopy.gradingWrong')}
                        value={`${result.wrong}`}
                        tone="clay"
                      />
                      <Stat
                        label={t('workspaceCopy.m326')}
                        value={`${result.blank}`}
                        tone="ink-3"
                      />
                    </div>

                    <div className="mt-6 max-h-64 space-y-2 overflow-y-auto">
                      {result.details
                        .filter((d) => !d.ok)
                        .map((d) => (
                          <div
                            key={d.i}
                            className="bg-clay-soft/60 flex items-center gap-2.5 rounded-[6px] px-3.5 py-2 text-[12.5px]"
                          >
                            <XCircle className="text-clay size-3.5 shrink-0" />
                            <span className="tnum text-ink-3">
                              {t('workspaceCopy.m186')}
                              {d.i}
                              {t('workspaceCopy.m320')}
                            </span>
                            <span className="text-ink">
                              {t('workspaceCopy.m490')}
                              <b>{d.given}</b>
                            </span>
                            <span className="text-ink-3">{t('workspaceCopy.m491')}</span>
                            <span className="text-sage font-bold">{d.correct}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                icon={<ClipboardList className="size-6" strokeWidth={1.6} />}
                title={t('workspaceCopy.m492')}
                description={t('workspaceCopy.m493')}
              />
            )}
          </Card>
        </div>
      </PageShell>
    )
  }
  return null
}
export function GradingStatUi(
  props: ReturnType<typeof GradingModel.useStatContainer> & {
    parts: typeof GradingParts
  },
) {
  if (props.viewState === 0) {
    const { label, colors, tone, value } = props
    return (
      <div className="bg-canvas/60 rounded-[10px] px-4 py-3">
        <p className="eyebrow">{label}</p>
        <p className={cn('font-display tnum mt-1 text-[24px] font-semibold', colors[tone])}>
          {value}
        </p>
      </div>
    )
  }
  return null
}
