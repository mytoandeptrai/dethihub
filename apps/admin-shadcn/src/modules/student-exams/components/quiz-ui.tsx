'use client'
import {
  Link,
  data_questions_QUESTION_STATES as QUESTION_STATES,
  lib_grading_SHORT_MAX_CHARS as SHORT_MAX_CHARS,
  lib_grading_describeAnswer as describeAnswer,
  lib_math_formatPoints as formatPoints,
  lib_grading_isAutoGraded as isAutoGraded,
  lib_grading_isFullyCorrect as isFullyCorrect,
  lib_grading_scoreQuestion as scoreQuestion,
} from '@student-engine'
import { cn } from '@workspace/ui/lib/utils'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clock,
  Flag,
  LayoutGrid,
  RotateCcw,
  Send,
  Trophy,
  X,
} from 'lucide-react'
import Image from 'next/image'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  Toolbar,
} from '@/components/product-ui'
import { MathText, QuestionBody } from '@/components/student-kernel'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-student'

import type {
  QuizParts as Imported0,
  QuizParts as Imported1,
  QuizParts as Imported2,
  QuizParts as Imported3,
  QuizParts as Imported4,
  QuizParts as Imported5,
  QuizParts as Imported6,
} from '@/modules/student-exams/containers/quiz-container/quiz-container'
import type { QuizModel } from '@/modules/student-exams/hooks'

export function QuizUi(
  props: ReturnType<typeof QuizModel.useQuizContainer> & {
    parts: typeof Imported0
  },
) {
  const { LegendRow, QuestionCard, ReviewView, ResultView } = props.parts
  if (props.viewState === 0) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={<AlertCircle className="size-6" strokeWidth={1.6} />}
          title={t('studentCopy.m309')}
          description={t('studentCopy.m310')}
          action={
            <Link to={appPaths.community.href}>
              <Button variant="primary">{t('studentCopy.m62')}</Button>
            </Link>
          }
        />
      </div>
    )
  }
  if (props.viewState === 1) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={<CircleHelp className="size-6" strokeWidth={1.6} />}
          title={t('studentCopy.m311')}
          description={t('studentCopy.m312')}
          action={
            <Link to={appPaths.editor.href}>
              <Button variant="primary">{t('studentCopy.m313')}</Button>
            </Link>
          }
        />
      </div>
    )
  }
  if (props.viewState === 2) {
    const {
      reviewing,
      questions,
      answers,
      index,
      setIndex,
      setReviewing,
      restart,
      exam,
      lastResult,
      totalPoints,
      gradable,
      scoreHidden,
      pending,
      sent,
    } = props
    return reviewing ? (
      <ReviewView
        questions={questions}
        answers={answers}
        index={index}
        setIndex={setIndex}
        onBack={() => setReviewing(false)}
        onRestart={restart}
      />
    ) : (
      <ResultView
        examTitle={exam.title}
        score={lastResult.score}
        totalPoints={totalPoints}
        gradable={gradable}
        correctCount={lastResult.correct}
        scoreHidden={scoreHidden}
        pending={pending}
        questions={questions}
        answers={answers}
        note={
          scoreHidden
            ? undefined
            : sent === 'sent'
              ? t('studentCopy.m314')
              : sent === 'failed'
                ? t('studentCopy.m315')
                : undefined
        }
        onRestart={restart}
        onReview={() => {
          setIndex(0)
          setReviewing(true)
        }}
      />
    )
  }
  if (props.viewState === 3) {
    const {
      exam,
      index,
      questions,
      answered,
      setShowGrid,
      noLimit,
      low,
      mm,
      ss,
      setConfirm,
      current,
      answers,
      setAnswer,
      instant,
      markChecked,
      flagged,
      setFlagged,
      isChecked,
      setIndex,
      totalPoints,
      gridAnim,
      confirm,
      handleSubmit,
    } = props
    return (
      <div className="bg-sunken/35 min-h-[calc(100dvh-3.5rem)]">
        <div className="border-line/70 bg-canvas/85 sticky top-[68px] z-30 border-b backdrop-blur-xl">
          <Toolbar className="mx-auto mb-0 min-h-16 max-w-[1180px] flex-nowrap gap-2 rounded-none border-0 bg-transparent px-4 py-3 shadow-none sm:gap-3 sm:px-6">
            <Link
              to={appPaths.community.href}
              className="bg-cream text-ink-2 shadow-soft hover:text-ink flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
              data-tip={t('studentCopy.m316')}
              aria-label={t('studentCopy.m316')}
            >
              <X className="size-4" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="font-display text-ink truncate text-[15px] font-semibold">
                {exam.title}
              </p>
              <p className="text-ink-3 tnum mt-0.5 text-[12px] font-medium">
                {t('studentCopy.m186')}
                {index + 1}
                {t('studentCopy.m263')}
                {questions.length}
                {t('studentCopy.m130')}
                {answered}
                {t('studentCopy.m317')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGrid(true)}
              className="bg-cream text-ink-2 shadow-soft hover:text-ink hidden items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors sm:flex"
            >
              <LayoutGrid className="size-3.5" />
              {t('studentCopy.m318')}
            </button>

            {noLimit ? (
              <div className="border-line bg-surface text-caption text-ink-3 flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-2 font-semibold sm:px-3.5">
                <Clock className="size-3.5" />
                {t('studentCopy.m93')}
              </div>
            ) : (
              <div
                className={cn(
                  'border-line flex shrink-0 items-center gap-2 rounded-lg border px-2 py-2 font-mono text-[13.5px] font-bold tabular-nums transition-colors duration-200 sm:px-3.5',
                  low ? 'bg-clay-soft text-clay' : 'bg-cream text-ink shadow-soft',
                )}
                data-tip={t('studentCopy.m319')}
              >
                <Clock className="size-3.5" />
                {mm}
                {t('studentCopy.m320')}
                {ss}
              </div>
            )}

            <Button
              variant="clay"
              size="sm"
              aria-label={t('studentCopy.m321')}
              onClick={() => setConfirm(true)}
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">{t('studentCopy.m321')}</span>
            </Button>
          </Toolbar>

          <div className="bg-veil h-1 w-full">
            <div
              className="bg-clay h-full rounded-r-full transition-[width] duration-500 ease-out"
              style={{ width: `${(answered / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1180px] min-w-0 px-4 py-6 sm:px-6 lg:py-8">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_272px]">
            <div className="min-w-0">
              <QuestionCard
                question={current}
                index={index}
                total={questions.length}
                chosen={answers[current.id]}
                onAnswer={(v) => {
                  setAnswer(current.id, v)
                  if (instant && current.type === 'trac-nghiem') markChecked()
                }}
                flagged={flagged.has(current.id)}
                onToggleFlag={() =>
                  setFlagged((f) => {
                    const next = new Set(f)
                    if (next.has(current.id)) next.delete(current.id)
                    else next.add(current.id)
                    return next
                  })
                }
                review={isChecked}
              />

              {instant && !isChecked && current.type !== 'trac-nghiem' ? (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={markChecked}
                    disabled={isAutoGraded(current) && !answers[current.id]}
                  >
                    {isAutoGraded(current) ? t('studentCopy.m322') : t('studentCopy.m323')}
                  </Button>
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="soft"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                >
                  <ArrowLeft className="size-4" />
                  {t('studentCopy.m139')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={index === questions.length - 1}
                >
                  {t('studentCopy.m140')}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="border-line bg-surface sticky top-[148px] rounded-xl border p-5 shadow-sm">
                <p className="eyebrow mb-4">{t('studentCopy.m129')}</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {questions.map((q, i) => {
                    const state = QUESTION_STATES.answered(answers[q.id])
                      ? 'answered'
                      : i === index
                        ? 'current'
                        : 'blank'
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={cn(
                          'tnum flex size-9 items-center justify-center rounded-[5px] text-[12px] font-bold transition-all duration-200',
                          state === 'answered'
                            ? 'bg-sage-soft text-sage'
                            : state === 'current'
                              ? 'bg-ink text-paper shadow-[0_4px_12px_-4px_rgba(35,32,28,0.6)]'
                              : 'bg-sunken text-ink-3 hover:bg-veil',
                        )}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>

                <div className="border-line-2 mt-5 space-y-2 border-t pt-4">
                  <LegendRow className="bg-sage-soft text-sage" label={t('studentCopy.m324')} />
                  <LegendRow className="bg-ink text-paper" label={t('studentCopy.m325')} />
                  <LegendRow className="bg-sunken text-ink-3" label={t('studentCopy.m326')} />
                </div>

                <div className="border-line-2 mt-5 space-y-2 border-t pt-4 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-3">{t('studentCopy.m324')}</span>
                    <span className="tnum text-ink font-bold">
                      {answered}
                      {t('studentCopy.m263')}
                      {questions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-3">{t('studentCopy.m327')}</span>
                    <span className="tnum text-ink font-bold">
                      {formatPoints(totalPoints)}
                      {t('studentCopy.m66')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="soft"
                  size="sm"
                  className="mt-5 w-full"
                  onClick={() => setShowGrid(true)}
                >
                  <LayoutGrid className="size-3.5" />
                  {t('studentCopy.m328')}
                </Button>
              </div>
            </aside>
          </div>
        </div>

        {gridAnim.mounted ? (
          <div
            className={`bg-ink/35 fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm sm:items-center sm:p-4 ${gridAnim.closing ? 'backdrop-out' : 'backdrop-in'}`}
            onClick={() => setShowGrid(false)}
          >
            <div
              className={`bg-canvas shadow-float w-full max-w-[560px] rounded-t-[28px] p-6 sm:rounded-[28px] ${gridAnim.closing ? 'sheet-out-down' : 'anim-sheet'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-display text-ink text-[19px] font-semibold">
                    {t('studentCopy.m129')}
                  </p>
                  <p className="text-ink-3 tnum mt-1 text-[12.5px] font-medium">
                    {answered}
                    {t('studentCopy.m263')}
                    {questions.length}
                    {t('studentCopy.m317')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGrid(false)}
                  className="bg-sunken text-ink-2 hover:text-ink flex size-9 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
                {questions.map((q, i) => {
                  const isAnswered = Boolean(answers[q.id])
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setIndex(i)
                        setShowGrid(false)
                      }}
                      className={cn(
                        'tnum relative flex h-10 w-full items-center justify-center rounded-[6px] text-[12.5px] font-bold transition-all duration-200',
                        isAnswered
                          ? 'bg-sage-soft text-sage'
                          : i === index
                            ? 'bg-ink text-paper'
                            : 'bg-sunken text-ink-3 hover:bg-veil',
                      )}
                    >
                      {i + 1}
                      {flagged.has(q.id) ? (
                        <span className="border-paper bg-clay absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2" />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-2.5">
                <Button variant="soft" className="flex-1" onClick={() => setShowGrid(false)}>
                  {t('studentCopy.m329')}
                </Button>
                <Button variant="clay" className="flex-1" onClick={() => setConfirm(true)}>
                  <Send className="size-4" />
                  {t('studentCopy.m321')}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {confirm ? (
          <div className="bg-ink/35 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-canvas shadow-float anim-pop w-full max-w-[400px] rounded-[8px] p-6">
              <p className="font-display text-ink text-[20px] font-semibold">
                {t('studentCopy.m330')}
              </p>
              <p className="text-ink-2 mt-2.5 text-[14px] leading-relaxed">
                {t('studentCopy.m331')}{' '}
                <span className="text-ink tnum font-bold">
                  {answered}
                  {t('studentCopy.m263')}
                  {questions.length}
                </span>{' '}
                {t('studentCopy.m332')}
                {answered < questions.length ? (
                  <span className="text-clay">
                    {t('studentCopy.m333')}
                    {questions.length - answered}
                    {t('studentCopy.m334')}
                  </span>
                ) : null}
              </p>
              <div className="mt-6 flex gap-2.5">
                <Button variant="soft" className="flex-1" onClick={() => setConfirm(false)}>
                  {t('studentCopy.m335')}
                </Button>
                <Button variant="clay" className="flex-1" onClick={handleSubmit}>
                  {t('studentCopy.m336')}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
  return null
}
export function QuizLegendRowUi(
  props: ReturnType<typeof QuizModel.useLegendRowContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const { className, label } = props
    return (
      <div className="flex items-center gap-2.5">
        <span className={cn('size-4 rounded-[5px]', className)} />
        <span className="text-ink-3 text-[12.5px] font-medium">{label}</span>
      </div>
    )
  }
  return null
}
export function QuizQuestionCardUi(
  props: ReturnType<typeof QuizModel.useQuestionCardContainer> & {
    parts: typeof Imported2
  },
) {
  const { TrueFalseInput, ShortAnswerInput } = props.parts
  if (props.viewState === 0) {
    const { index, total, review, graded, chosen, ok, onToggleFlag, flagged, question, onAnswer } =
      props
    return (
      <Card className="min-w-0 rounded-xl p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone="neutral">
            {t('studentCopy.m186')}
            {index + 1}
            {t('studentCopy.m24')}
            {total}
          </Badge>
          {review ? (
            graded ? (
              <span
                className={cn(
                  'rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
                  chosen
                    ? ok
                      ? 'bg-sage-soft text-sage'
                      : 'bg-clay-soft text-clay'
                    : 'bg-sunken text-ink-3',
                )}
              >
                {chosen ? (ok ? t('studentCopy.m187') : 'Sai') : t('studentCopy.m326')}
              </span>
            ) : null
          ) : (
            <button
              type="button"
              onClick={onToggleFlag}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-200',
                flagged ? 'bg-clay-soft text-clay' : 'text-ink-3 hover:bg-sunken',
              )}
            >
              <Flag className="size-3.5" />
              {flagged ? t('studentCopy.m337') : t('studentCopy.m338')}
            </button>
          )}
        </div>

        <QuestionBody q={question} className="prose-exam text-[17px]" />
        <p className="text-ink-3 tnum mt-2.5 text-[12.5px] font-semibold">
          {formatPoints(question.points)}
          {t('studentCopy.m339')}
        </p>

        {question.type === 'dung-sai' && question.options ? (
          <TrueFalseInput question={question} chosen={chosen} onAnswer={onAnswer} review={review} />
        ) : question.type === 'tra-loi-ngan' ? (
          review ? (
            <div className="mt-6 flex flex-wrap gap-3 font-mono text-[18px]">
              <span
                className={cn(
                  'rounded-[8px] px-4 py-2.5',
                  ok ? 'bg-sage-soft text-sage' : 'bg-clay-soft text-clay',
                )}
              >
                {t('studentCopy.m340')}
                {chosen || t('studentCopy.m341')}
              </span>
              {!ok && question.answer ? (
                <span className="bg-sage-soft text-sage rounded-[8px] px-4 py-2.5">
                  {t('studentCopy.m188')}
                  {question.answer}
                </span>
              ) : null}
            </div>
          ) : (
            <ShortAnswerInput chosen={chosen} onAnswer={onAnswer} />
          )
        ) : question.options ? (
          <ul className="mt-6 space-y-2.5">
            {question.options.map((opt) => {
              const active = chosen === opt.key
              const right = review && opt.key === question.answer
              const wrong = review && active && !right
              return (
                <li key={opt.key}>
                  <button
                    type="button"
                    onClick={review ? undefined : () => onAnswer(opt.key)}
                    className={cn(
                      'group flex w-full items-start gap-3.5 rounded-[8px] px-4 py-3.5 text-left transition-all duration-200',
                      review && 'cursor-default',
                      right
                        ? 'bg-sage-soft ring-sage ring-2'
                        : wrong
                          ? 'bg-clay-soft ring-clay ring-2'
                          : active
                            ? 'bg-sunken shadow-[inset_0_0_0_1.5px_rgba(35,32,28,0.85)]'
                            : !review && 'hover:bg-sunken/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border text-[12.5px] font-bold transition-all duration-200',
                        right
                          ? 'border-sage bg-sage text-white'
                          : wrong
                            ? 'border-clay bg-clay text-white'
                            : active
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line-2 text-ink-3 group-hover:border-ink-4 bg-white',
                      )}
                    >
                      {right ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : wrong ? (
                        <X className="size-3.5" strokeWidth={3} />
                      ) : active ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : (
                        opt.key
                      )}
                    </span>
                    <span className="prose-exam min-w-0 flex-1 text-[15px]">
                      <MathText as="span" className="inline">
                        {opt.text}
                      </MathText>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : review ? (
          <div className="bg-sage-soft text-ink mt-6 space-y-1.5 rounded-[8px] px-5 py-4 text-[14px]">
            {question.solution?.length ? (
              question.solution.map((line) => (
                <MathText key={line} as="div">
                  {line}
                </MathText>
              ))
            ) : (
              <span className="text-ink-3 italic">{t('studentCopy.m342')}</span>
            )}
          </div>
        ) : (
          <div className="border-line-2 bg-canvas/50 text-ink-3 mt-6 rounded-[8px] border border-dashed px-5 py-8 text-center text-[13.5px] italic">
            {t('studentCopy.m343')}
          </div>
        )}

        {review && question.explanation ? (
          <div className="bg-sunken text-ink-2 mt-5 rounded-[8px] px-5 py-4 text-[13.5px] leading-relaxed">
            <span className="text-ink font-semibold">{t('studentCopy.m344')}</span>
            <MathText as="span" className="inline">
              {question.explanation}
            </MathText>
          </div>
        ) : null}
      </Card>
    )
  }
  return null
}
export function QuizReviewViewUi(
  props: ReturnType<typeof QuizModel.useReviewViewContainer> & {
    parts: typeof Imported3
  },
) {
  const { LegendRow, QuestionCard } = props.parts
  if (props.viewState === 0) {
    const { onBack, onRestart, questions, answers, setIndex, index, q } = props
    return (
      <div className="bg-sunken/35 min-h-[calc(100dvh-3.5rem)]">
        <div className="mx-auto max-w-[900px] px-5 py-9 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="soft" size="sm" onClick={onBack}>
              <ArrowLeft className="size-3.5" />
              {t('studentCopy.m345')}
            </Button>
            <p className="font-display text-ink text-[15px] font-semibold">
              {t('studentCopy.m346')}
            </p>
            {onRestart ? (
              <Button variant="clay" size="sm" onClick={onRestart}>
                <RotateCcw className="size-3.5" />
                {t('studentCopy.m347')}
              </Button>
            ) : (
              <span />
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {questions.map((x, i) => {
              const given = answers[x.id]
              const tone = given
                ? isAutoGraded(x)
                  ? isFullyCorrect(x, given)
                    ? 'bg-sage text-white'
                    : 'bg-clay text-white'
                  : 'bg-sunken text-ink-2'
                : 'bg-sunken text-ink-3'
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'tnum flex size-9 items-center justify-center rounded-[5px] text-[12px] font-bold transition-all duration-200',
                    tone,
                    i === index && 'ring-ink ring-offset-canvas ring-2 ring-offset-2',
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mb-6 flex flex-wrap gap-x-5 gap-y-1">
            <LegendRow className="bg-sage" label={t('studentCopy.m187')} />
            <LegendRow className="bg-clay" label="Sai" />
            <LegendRow className="bg-sunken ring-line-2 ring-1" label={t('studentCopy.m348')} />
          </div>

          <QuestionCard
            question={q}
            index={index}
            total={questions.length}
            chosen={answers[q.id]}
            onAnswer={() => {}}
            flagged={false}
            onToggleFlag={() => {}}
            review
          />

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="soft"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ArrowLeft className="size-4" />
              {t('studentCopy.m139')}
            </Button>
            <Button
              variant="primary"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
            >
              {t('studentCopy.m140')}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return null
}
export function QuizTrueFalseInputUi(
  props: ReturnType<typeof QuizModel.useTrueFalseInputContainer> & {
    parts: typeof Imported4
  },
) {
  if (props.viewState === 0) {
    const { options, values, review, set, correct } = props
    return (
      <ul className="mt-6 space-y-2.5">
        {options.map((opt, i) => (
          <li key={opt.key} className="flex items-start gap-3.5 rounded-[8px] px-4 py-3">
            <span className="border-line-2 text-ink-3 flex size-7 shrink-0 items-center justify-center rounded-full border bg-white text-[12.5px] font-bold">
              {opt.key}
            </span>
            <span className="prose-exam min-w-0 flex-1 text-[15px]">
              <MathText as="span" className="inline">
                {opt.text}
              </MathText>
            </span>
            <span className="flex shrink-0 gap-1.5">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={values[i] === v}
                  onClick={review ? undefined : () => set(i, v)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200',
                    review && 'cursor-default',
                    correct?.[i] === v
                      ? 'border-sage bg-sage text-white'
                      : review && values[i] === v
                        ? 'border-clay bg-clay text-white'
                        : values[i] === v
                          ? 'border-ink bg-ink text-paper'
                          : review
                            ? 'border-line-2 text-ink-3 bg-white'
                            : 'border-line-2 text-ink-3 hover:border-ink-4 hover:text-ink bg-white',
                  )}
                >
                  {v ? t('studentCopy.m187') : 'Sai'}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    )
  }
  return null
}
export function QuizShortAnswerInputUi(
  props: ReturnType<typeof QuizModel.useShortAnswerInputContainer> & {
    parts: typeof Imported5
  },
) {
  if (props.viewState === 0) {
    const { chosen, onAnswer } = props
    return (
      <div className="mt-6">
        <input
          value={chosen ?? ''}
          inputMode="decimal"
          maxLength={SHORT_MAX_CHARS}
          autoComplete="off"
          aria-label={t('studentCopy.m349')}
          placeholder={t('studentCopy.m350')}
          onChange={(e) =>
            onAnswer(
              e.target.value
                .replaceAll('.', ',')
                .replaceAll(/[^0-9,-]/g, '')
                .slice(0, SHORT_MAX_CHARS),
            )
          }
          className="border-line-2 text-ink focus:border-ink w-44 rounded-[8px] border bg-white px-4 py-3 text-center font-mono text-[22px] tracking-[0.35em] outline-none"
        />
        <p className="text-ink-3 mt-2.5 text-[12.5px]">
          {t('studentCopy.m351')}
          {SHORT_MAX_CHARS}
          {t('studentCopy.m352')}
        </p>
      </div>
    )
  }
  return null
}
export function QuizResultViewUi(
  props: ReturnType<typeof QuizModel.useResultViewContainer> & {
    parts: typeof Imported6
  },
) {
  if (props.viewState === 0) {
    const {
      examTitle,
      pending,
      scoreHidden,
      noKey,
      score,
      gradable,
      tone,
      grade,
      correct,
      gradedCount,
      questions,
      pct,
      skipped,
      note,
      onReview,
      onRestart,
      answers,
    } = props
    return (
      <PageShell className="max-w-[1000px] py-8 lg:py-12">
        <PageHeader eyebrow={t('studentCopy.m353')} title={examTitle} />
        <Card className="relative overflow-hidden rounded-xl p-5 text-center sm:p-8">
          <div className="relative">
            <span className="bg-sunken text-ink-2 mx-auto flex size-16 items-center justify-center rounded-full">
              <Trophy className="size-7" strokeWidth={1.5} />
            </span>

            {pending ? (
              <p className="font-display text-ink-3 mt-4 text-[24px] font-semibold">
                {t('studentCopy.m354')}
              </p>
            ) : scoreHidden ? (
              <>
                <p className="font-display text-ink mt-3 text-[28px] font-semibold">
                  {t('studentCopy.m355')}
                </p>
                <p className="text-ink-3 mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed">
                  {t('studentCopy.m356')}
                </p>
              </>
            ) : noKey ? (
              <>
                <p className="font-display text-ink mt-3 text-[28px] font-semibold">
                  {t('studentCopy.m357')}
                </p>
                <p className="text-ink-3 mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed">
                  {t('studentCopy.m358')}
                </p>
              </>
            ) : (
              <>
                <div className="mt-6 grid items-stretch gap-3 sm:grid-cols-3">
                  <Card className="bg-sunken/40 font-display text-ink tnum flex min-h-28 flex-col justify-center p-5 text-[40px] leading-none font-semibold tracking-tight">
                    {formatPoints(score)}
                    <span className="text-ink-4 text-[26px]">
                      {t('studentCopy.m263')}
                      {formatPoints(gradable)}
                    </span>
                  </Card>
                  <Card
                    className={cn(
                      'font-display text-subtitle flex min-h-28 flex-col justify-center p-5 font-semibold',
                      tone,
                    )}
                  >
                    {grade}
                  </Card>
                  <Card className="text-body text-ink-3 flex min-h-28 flex-col justify-center p-5">
                    {t('studentCopy.m359')}
                    {correct}
                    {t('studentCopy.m263')}
                    {gradedCount > 0 ? gradedCount : questions.length}
                    {t('studentCopy.m124')}
                    {pct.toFixed(1)}
                    {t('studentCopy.m360')}
                  </Card>
                </div>
                {skipped > 0 ? (
                  <p className="text-ink-4 mt-1 text-[12.5px]">
                    {t('studentCopy.m361')}
                    {formatPoints(skipped)}
                    {t('studentCopy.m362')}
                    {questions.length - gradedCount}
                    {t('studentCopy.m363')}
                  </p>
                ) : null}

                <div className="bg-sunken mx-auto mt-8 h-2.5 w-full max-w-[380px] overflow-hidden rounded-full">
                  <div
                    className="bg-clay h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </>
            )}

            {note ? (
              <p role="status" className="text-ink-4 mt-2 text-[12.5px]">
                {note}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Button variant="soft" onClick={onReview}>
                <ArrowLeft className="size-4" />
                {t('studentCopy.m346')}
              </Button>
              {onRestart ? (
                <Button variant="clay" onClick={onRestart}>
                  <RotateCcw className="size-4" />
                  {t('studentCopy.m347')}
                </Button>
              ) : null}
              <Link to={appPaths.community.href}>
                <Button variant="ghost">{t('studentCopy.m364')}</Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-9 space-y-3">
          <p className="eyebrow">{t('studentCopy.m365')}</p>
          {questions.map((q, i) => {
            const given = answers[q.id]
            const got = scoreQuestion(q, given)
            const ok = isFullyCorrect(q, given)
            const graded = isAutoGraded(q)
            return (
              <div
                key={q.id}
                className={cn(
                  'flex items-start gap-3.5 rounded-[10px] px-5 py-4',
                  graded ? (ok ? 'bg-sage-soft/70' : 'bg-clay-soft/60') : 'bg-sunken',
                )}
              >
                <span
                  className={cn(
                    'tnum mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold',
                    graded
                      ? ok
                        ? 'bg-sage text-white'
                        : 'bg-clay text-white'
                      : 'bg-ink-4 text-white',
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-[13.5px] leading-relaxed">
                    <MathText as="span" className="inline">
                      {q.prompt}
                    </MathText>
                  </p>
                  {q.image?.src ? (
                    <Image
                      unoptimized
                      width={1920}
                      height={1080}
                      style={{ width: 'auto', height: 'auto' }}
                      src={q.image.src}
                      alt={q.image.alt ?? ''}
                      className="mt-2 max-h-40 max-w-full rounded-[6px] bg-white object-contain"
                    />
                  ) : null}
                  <p className="text-ink-3 mt-1.5 text-[12.5px]">
                    {t('studentCopy.m366')}{' '}
                    <span className="text-ink-2 font-semibold">
                      {describeAnswer(q, given) || t('studentCopy.m341')}
                    </span>
                    {t('studentCopy.m367')}
                    <span className="text-ink font-semibold">
                      {describeAnswer(q, q.answer) ||
                        (q.type.startsWith('tu-luan') ? '—' : t('studentCopy.m368'))}
                    </span>
                    {graded && q.type === 'dung-sai' ? (
                      <span className="ml-1">
                        {t('studentCopy.m369')}
                        <span className="text-ink-2 tnum font-semibold">{formatPoints(got)}</span>
                        {t('studentCopy.m263')}
                        {formatPoints(q.points)}
                        {t('studentCopy.m66')}
                      </span>
                    ) : null}
                  </p>
                  {q.explanation ? (
                    <p className="text-ink-3 mt-1.5 text-[12.5px] leading-relaxed italic">
                      <MathText as="span" className="inline">
                        {q.explanation}
                      </MathText>
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </PageShell>
    )
  }
  return null
}
