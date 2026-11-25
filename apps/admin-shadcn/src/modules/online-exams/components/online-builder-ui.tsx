'use client'

import {
  lib_onlineExam_convertQuestion as convertQuestion,
  lib_onlineExam_evenPoints as evenPoints,
  lib_math_formatPoints as formatPoints,
  lib_grading_formatTrueFalse as formatTrueFalse,
  Link,
  Navigate,
  lib_onlineExam_ONLINE_TYPES as ONLINE_TYPES,
  lib_questionImage_pastedImage as pastedImage,
  lib_grading_readTrueFalseAnswer as readTrueFalseAnswer,
  lib_onlinePublish_shareUrl as shareUrl,
  lib_grading_SHORT_MAX_CHARS as SHORT_MAX_CHARS,
  lib_onlineExam_totalOf as totalOf,
  components_appIcons_TrashIcon as TrashIcon,
  data_types_TYPE_LABEL as TYPE_LABEL,
} from '@online-exams-engine'
import { cn } from '@workspace/ui/lib/utils'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Eye,
  MonitorPlay,
  Plus,
  Upload,
  X,
} from 'lucide-react'

import {
  MathText,
  OnlineAiBox,
  QuestionBody,
  QuestionImageField,
} from '@/components/online-exams-kernel'
import {
  Badge,
  SiteButton as Button,
  Card,
  Checkbox,
  CopyLink,
  EmptyState,
  Field,
  inputClass,
  PageHeader,
  PageShell,
  SiteSelect,
  Toolbar,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { PageSkeleton } from '@/components/page-skeleton'
import { OnlineBuilderModel } from '@/modules/online-exams/hooks'

import type { OnlineBuilderParts } from '@/modules/online-exams/containers/online-builder-container'
import type { data_types_Subject as Subject } from '@online-exams-engine'
const { STEPS, KEYS, SUBJECT_OPTIONS, GRADE_OPTIONS, textareaClass, oneLine } = OnlineBuilderModel
export function OnlineBuilderOnlineBuilderUi(
  props: ReturnType<typeof OnlineBuilderModel.useOnlineBuilderContainer> & {
    parts: typeof OnlineBuilderParts
  },
) {
  const { ExamPreview, Toggle, QuestionEditor } = props.parts
  if (props.viewState === 0) {
    return <Navigate to={appPaths.onlineExams.href} replace />
  }
  if (props.viewState === 2)
    return (
      <PageSkeleton variant="form" />
    )
  if (props.viewState === 3)
    return (
      <PageShell>
        <p role="alert">{props.error}</p>
      </PageShell>
    )
  if (props.viewState === 1) {
    const {
      item,
      questions,
      setPreview,
      preview,
      step,
      goStep,
      error,
      notice,
      issueCount,
      fileRef,
      importFile,
      busy,
      add,
      issues,
      setSelectedId,
      current,
      setQuestions,
      currentIdx,
      patch,
      move,
      duplicate,
      remove,
      setMeta,
      setSettings,
      finish,
      loggedIn,
      publish,
      showInCommunity,
      onQuiz,
      onAiQuestions,
    } = props
    return (
      <PageShell>
        <PageHeader
          eyebrow={
            <Link
              to={appPaths.onlineExams.href}
              className="hover:text-ink inline-flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              {t('onlineExamsCopy.m123')}
            </Link>
          }
          title={item.meta.title.trim() || t('onlineExamsCopy.m91')}
          count={
            <span className="flex flex-wrap items-center gap-2">
              {questions.length}
              {t('onlineExamsCopy.m124')}
              {formatPoints(totalOf(questions))}
              {t('onlineExamsCopy.m125')}
              <Badge variant="secondary">
                {item.status === 'done' ? t('onlineExamsCopy.m89') : t('onlineExamsCopy.m90')}
              </Badge>
            </span>
          }
          actions={
            <>
              <p className="text-ink-3 text-xs">
                {t('onlineExamsCopy.m126')}
                {new Date(item.updatedAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {questions.length > 0 ? (
                <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
                  {preview ? <X className="size-3.5" /> : <Eye className="size-3.5" />}
                  {preview ? t('onlineExamsCopy.m127') : t('onlineExamsCopy.m128')}
                </Button>
              ) : null}
            </>
          }
        />

        {preview ? <ExamPreview title={item.meta.title} questions={questions} /> : null}

        <Toolbar className={cn('block max-w-full overflow-x-auto p-2', preview && 'hidden')}>
          <ol className="flex min-w-max gap-2">
            {STEPS.map((label, i) => {
              const active = step === i
              const passed = step > i
              return (
                <li key={label} className="flex-1">
                  <button
                    type="button"
                    onClick={() => goStep(i)}
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm',
                      active
                        ? 'bg-sunken text-ink shadow-sm'
                        : 'text-ink-3 hover:bg-sunken/50 hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'tnum flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                        active
                          ? 'bg-clay-soft text-clay'
                          : passed
                            ? 'bg-sage text-white'
                            : 'text-ink-3 bg-white',
                      )}
                    >
                      {passed ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    {label}
                  </button>
                </li>
              )
            })}
          </ol>
        </Toolbar>

        {error ? (
          <p
            role="alert"
            className="bg-clay-soft text-clay-deep mb-6 rounded-[6px] px-4 py-3 text-[13.5px] font-medium"
          >
            {error}{' '}
            {error.includes(t('onlineExamsCopy.m106')) ? (
              <Link to={appPaths.auth.login.href} className="underline">
                {t('onlineExamsCopy.m107')}
              </Link>
            ) : null}
          </p>
        ) : null}

        {notice ? (
          <p
            role="status"
            className="bg-sage-soft text-sage mb-6 rounded-[6px] px-4 py-3 text-[13.5px] font-medium"
          >
            {notice}
          </p>
        ) : null}

        {!preview && step === 0 ? (
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card asChild className="min-w-0 rounded-xl p-4 lg:sticky lg:top-[88px]">
              <aside>
                <p className="eyebrow mb-1">{t('onlineExamsCopy.m129')}</p>
                <p className="tnum text-ink-3 mb-4 text-[12.5px]">
                  {questions.length}
                  {t('onlineExamsCopy.m124')}
                  {formatPoints(totalOf(questions))}
                  {t('onlineExamsCopy.m66')}
                  {issueCount ? (
                    <span className="text-clay font-semibold">
                      {t('onlineExamsCopy.m130')}
                      {issueCount}
                      {t('onlineExamsCopy.m131')}
                    </span>
                  ) : null}
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) void importFile(f)
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="bg-ink text-paper mb-4 flex w-full items-center justify-center gap-1.5 rounded-[6px] px-2 py-2 text-[12.5px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Upload className="size-3.5" />
                  {busy ? t('onlineExamsCopy.m132') : t('onlineExamsCopy.m133')}
                </button>

                <div className="mb-4 grid grid-cols-2 gap-1.5">
                  {ONLINE_TYPES.map((questionType) => (
                    <button
                      key={questionType}
                      type="button"
                      onClick={() => add(questionType)}
                      className="bg-sunken text-ink-2 hover:bg-veil hover:text-ink flex items-center justify-center gap-1.5 rounded-[6px] px-2 py-2 text-[12.5px] font-semibold transition-colors"
                    >
                      <Plus className="size-3.5" />
                      {TYPE_LABEL[questionType]}
                    </button>
                  ))}
                </div>

                {questions.length > 0 ? (
                  <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                    {ONLINE_TYPES.map((questionType) => {
                      const group = questions.filter(
                        (q) => (q.type === 'tu-luan-dong' ? 'tu-luan' : q.type) === questionType,
                      )
                      if (group.length === 0) return null
                      return (
                        <div key={questionType}>
                          <p className="text-ink-4 mb-1.5 text-[11.5px] font-bold tracking-wide uppercase">
                            {TYPE_LABEL[questionType]}
                          </p>
                          <ul className="space-y-0.5">
                            {group.map((q) => {
                              const bad = Boolean(issues[questions.indexOf(q)])
                              return (
                                <li key={q.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedId(q.id)}
                                    className={cn(
                                      'flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-left transition-colors',
                                      q.id === current?.id ? 'bg-sunken' : 'hover:bg-sunken/60',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'tnum flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                                        bad ? 'bg-clay-soft text-clay' : 'bg-sage-soft text-sage',
                                      )}
                                    >
                                      {q.number}
                                    </span>
                                    <MathText className="text-ink-2 min-w-0 flex-1 truncate text-[13px]">
                                      {oneLine(q.prompt) || t('onlineExamsCopy.m134')}
                                    </MathText>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-ink-3 text-[13px] leading-relaxed">
                    {t('onlineExamsCopy.m135')}
                  </p>
                )}

                {questions.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuestions(evenPoints(questions))}
                    className="text-ink-3 hover:text-ink mt-4 text-[12.5px] font-semibold underline-offset-4 transition-colors hover:underline"
                  >
                    {t('onlineExamsCopy.m136')}
                  </button>
                ) : null}
              </aside>
            </Card>

            <section className="min-w-0">
              <OnlineAiBox meta={item.meta} questions={questions} onAdd={onAiQuestions} />
              {current ? (
                <QuestionEditor
                  key={current.id}
                  q={current}
                  issue={issues[currentIdx] ?? null}
                  canUp={questions[currentIdx - 1]?.type === current.type}
                  canDown={questions[currentIdx + 1]?.type === current.type}
                  onPatch={(p) => patch(current, p)}
                  onType={(questionType) =>
                    setQuestions(
                      questions.map((x) =>
                        x.id === current.id ? convertQuestion(x, questionType) : x,
                      ),
                    )
                  }
                  onMove={(d) => move(current, d)}
                  onDuplicate={() => duplicate(current)}
                  onRemove={() => remove(current)}
                />
              ) : (
                <EmptyState
                  icon={<Plus className="size-6" strokeWidth={1.6} />}
                  title={t('onlineExamsCopy.m137')}
                  description={t('onlineExamsCopy.m138')}
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      {ONLINE_TYPES.map((questionType) => (
                        <Button
                          key={questionType}
                          variant={questionType === 'trac-nghiem' ? 'clay' : 'outline'}
                          size="sm"
                          onClick={() => add(questionType)}
                        >
                          {TYPE_LABEL[questionType]}
                        </Button>
                      ))}
                    </div>
                  }
                />
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={currentIdx <= 0}
                    onClick={() => setSelectedId(questions[currentIdx - 1]!.id)}
                  >
                    <ArrowLeft className="size-3.5" />
                    {t('onlineExamsCopy.m139')}
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={currentIdx < 0 || currentIdx >= questions.length - 1}
                    onClick={() => setSelectedId(questions[currentIdx + 1]!.id)}
                  >
                    {t('onlineExamsCopy.m140')}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
                <Button variant="primary" onClick={() => goStep(1)}>
                  {t('onlineExamsCopy.m141')}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>
          </div>
        ) : null}

        {!preview && step === 1 ? (
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <Card className="min-w-0 space-y-5 rounded-xl p-5 lg:sticky lg:top-[88px]">
              <h2 className="font-display text-ink text-[20px] font-semibold">
                {t('onlineExamsCopy.m142')}
              </h2>
              <Field label={t('onlineExamsCopy.m11')}>
                <input
                  className={inputClass}
                  value={item.meta.title}
                  onChange={(e) => setMeta({ title: e.target.value })}
                  placeholder={t('onlineExamsCopy.m143')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('onlineExamsCopy.m36')}>
                  <SiteSelect
                    value={item.meta.subject}
                    options={SUBJECT_OPTIONS}
                    onChange={(v) => setMeta({ subject: v as Subject })}
                    label={t('onlineExamsCopy.m36')}
                  />
                </Field>
                <Field label={t('onlineExamsCopy.m144')}>
                  <SiteSelect
                    value={item.meta.grade}
                    options={GRADE_OPTIONS}
                    onChange={(v) => setMeta({ grade: v })}
                    label={t('onlineExamsCopy.m144')}
                  />
                </Field>
              </div>
              <Field label={t('onlineExamsCopy.m145')}>
                <input
                  className={inputClass}
                  value={item.meta.school}
                  onChange={(e) => setMeta({ school: e.target.value })}
                  placeholder={t('onlineExamsCopy.m146')}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('onlineExamsCopy.m147')}>
                  <input
                    className={inputClass}
                    value={item.meta.year}
                    onChange={(e) => setMeta({ year: e.target.value })}
                  />
                </Field>
                <Field label={t('onlineExamsCopy.m148')}>
                  <input
                    className={inputClass}
                    value={item.meta.term}
                    onChange={(e) => setMeta({ term: e.target.value })}
                  />
                </Field>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="min-w-0 rounded-xl p-3">
                <h2 className="font-display text-ink px-3 pt-3 pb-1 text-[20px] font-semibold">
                  {t('onlineExamsCopy.m149')}
                </h2>
                <Toggle
                  label={t('onlineExamsCopy.m150')}
                  hint={t('onlineExamsCopy.m151')}
                  checked={Boolean(item.settings.noTimeLimit)}
                  onChange={(v) => setSettings({ noTimeLimit: v })}
                />
                <div
                  className={cn(
                    'px-4 pb-3',
                    item.settings.noTimeLimit && 'pointer-events-none opacity-40',
                  )}
                >
                  <Field label={t('onlineExamsCopy.m152')}>
                    <input
                      type="number"
                      min={1}
                      className={inputClass + ' max-w-[160px]'}
                      value={item.meta.durationMinutes}
                      onChange={(e) =>
                        setMeta({
                          durationMinutes: Math.max(1, Math.round(Number(e.target.value)) || 1),
                        })
                      }
                    />
                  </Field>
                </div>
                <Toggle
                  label={t('onlineExamsCopy.m153')}
                  hint={t('onlineExamsCopy.m154')}
                  checked={Boolean(item.settings.instantFeedback)}
                  onChange={(v) => setSettings({ instantFeedback: v })}
                />
                {item.settings.instantFeedback || item.publishedListed ? null : (
                  <Toggle
                    label={t('onlineExamsCopy.m155')}
                    hint={t('onlineExamsCopy.m156')}
                    checked={Boolean(item.settings.showScore)}
                    onChange={(v) => setSettings({ showScore: v })}
                  />
                )}
                <Toggle
                  label={t('onlineExamsCopy.m157')}
                  hint={t('onlineExamsCopy.m158')}
                  checked={Boolean(item.settings.shuffleQuestions)}
                  onChange={(v) => setSettings({ shuffleQuestions: v })}
                />
              </Card>

              <Card className="min-w-0 rounded-xl p-3">
                <h2 className="font-display text-ink px-3 pt-3 pb-1 text-[20px] font-semibold">
                  {t('onlineExamsCopy.m159')}
                </h2>
                {item.publishedListed ? (
                  <p className="bg-honey-soft text-honey mx-3 mt-2 rounded-[6px] px-3 py-2 text-[12.5px] leading-relaxed">
                    {t('onlineExamsCopy.m160')}
                  </p>
                ) : (
                  <p className="text-ink-3 px-3 text-[12.5px] leading-relaxed">
                    {t('onlineExamsCopy.m161')}
                  </p>
                )}
                <div className={cn(item.publishedListed && 'pointer-events-none opacity-40')}>
                  <Toggle
                    label={t('onlineExamsCopy.m162')}
                    hint={t('onlineExamsCopy.m163')}
                    checked={Boolean(item.settings.oneAttempt)}
                    onChange={(v) => setSettings({ oneAttempt: v })}
                  />
                  <div className="px-4 pb-3">
                    <Field label={t('onlineExamsCopy.m164')}>
                      <textarea
                        rows={5}
                        className={inputClass + ' h-auto py-2.5'}
                        placeholder={t('onlineExamsCopy.m165')}
                        defaultValue={(item.settings.roster ?? []).join('\n')}
                        onBlur={(e) => {
                          const names = e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean)
                          setSettings({ roster: names.length > 0 ? names : undefined })
                        }}
                      />
                    </Field>
                    <p className="text-ink-4 mt-1.5 text-[12px]">{t('onlineExamsCopy.m166')}</p>
                  </div>
                </div>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="soft" onClick={() => goStep(0)}>
                  <ArrowLeft className="size-4" />
                  {t('onlineExamsCopy.m167')}
                </Button>
                <Button variant="clay" onClick={finish}>
                  <Check className="size-4" />
                  {t('onlineExamsCopy.m168')}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!preview && step === 2 ? (
          <div className="bg-surface mx-auto max-w-[640px] rounded-[8px] p-8 text-center shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-10">
            <span className="bg-sage-soft text-sage mx-auto flex size-14 items-center justify-center rounded-full">
              <Check className="size-7" strokeWidth={2.5} />
            </span>
            <h2 className="font-display text-ink mt-5 text-[26px] font-semibold tracking-[-0.02em]">
              {t('onlineExamsCopy.m169')}
            </h2>
            <p className="text-ink-2 mt-2 text-[14.5px] leading-relaxed">
              {t('onlineExamsCopy.m170')}
              {item.meta.title.trim()}
              {t('onlineExamsCopy.m171')}
              {questions.length}
              {t('onlineExamsCopy.m124')}
              {formatPoints(totalOf(questions))}
              {t('onlineExamsCopy.m172')}{' '}
              {item.settings.noTimeLimit
                ? t('onlineExamsCopy.m173')
                : t('onlineExamsCopy.m174', { value0: item.meta.durationMinutes })}
            </p>
            <p className="text-ink-3 mt-1 text-[13px]">
              {loggedIn ? t('onlineExamsCopy.m175') : t('onlineExamsCopy.m176')}
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Button variant="clay" onClick={onQuiz}>
                <MonitorPlay className="size-4" />
                {t('onlineExamsCopy.m99')}
              </Button>
              {item.publishedId ? null : (
                <Button variant="primary" disabled={busy} onClick={() => void publish(false)}>
                  {t('onlineExamsCopy.createLink')}
                </Button>
              )}
              {item.publishedId ? null : (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void publish(true)}
                  data-tip={t('onlineExamsCopy.m101')}
                >
                  <Upload className="size-4" />
                  {busy ? t('onlineExamsCopy.m102') : t('onlineExamsCopy.m103')}
                </Button>
              )}
            </div>

            {item.publishedId ? (
              <div className="mt-7 text-left">
                <p className="text-ink mb-2 text-[13px] font-semibold">
                  {item.publishedListed === false
                    ? t('onlineExamsCopy.m177')
                    : t('onlineExamsCopy.m178')}
                  {t('onlineExamsCopy.m179')}
                </p>
                <CopyLink url={shareUrl(item.publishedId)} />
                <p className="text-ink-3 mt-2 text-[12px]">
                  {t('onlineExamsCopy.m180')}{' '}
                  <Link
                    to={appPaths.onlineExams.href + '?tab=published'}
                    className="font-semibold underline underline-offset-2"
                  >
                    {t('onlineExamsCopy.m84')}
                  </Link>
                  {t('onlineExamsCopy.m181')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={busy}
                    onClick={() => void publish(item.publishedListed !== false)}
                  >
                    <Copy className="size-3.5" />
                    {busy ? t('onlineExamsCopy.m182') : t('onlineExamsCopy.m183')}
                  </Button>
                  {item.publishedListed === false ? (
                    <Button
                      variant="soft"
                      size="sm"
                      disabled={busy}
                      onClick={() => void showInCommunity()}
                    >
                      <Upload className="size-3.5" />
                      {t('onlineExamsCopy.m101')}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="border-line-2 mt-8 flex flex-wrap justify-center gap-4 border-t pt-5 text-[13.5px] font-semibold">
              <button
                type="button"
                onClick={() => goStep(0)}
                className="text-ink-3 hover:text-ink transition-colors"
              >
                {t('onlineExamsCopy.m96')}
              </button>
              <Link
                to={appPaths.onlineExams.href}
                className="text-ink-3 hover:text-ink transition-colors"
              >
                {t('onlineExamsCopy.m184')}
              </Link>
            </div>
          </div>
        ) : null}
      </PageShell>
    )
  }
  return null
}
export function OnlineBuilderExamPreviewUi(
  props: ReturnType<typeof OnlineBuilderModel.useExamPreviewContainer> & {
    parts: typeof OnlineBuilderParts
  },
) {
  if (props.viewState === 0) {
    const { title, answers, setAnswers, questions, solutions } = props
    return (
      <div className="bg-surface mx-auto max-w-[760px] rounded-[8px] p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-9">
        <div className="border-line-2 mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <h2 className="font-display text-ink text-[22px] font-semibold">
            {title.trim() || t('onlineExamsCopy.m91')}
          </h2>
          <Checkbox
            checked={answers}
            onChange={setAnswers}
            className="text-ink-2 text-[13.5px] font-semibold"
          >
            {t('onlineExamsCopy.m185')}
          </Checkbox>
        </div>

        <ol className="space-y-8">
          {questions.map((q) => {
            const tf = readTrueFalseAnswer(q.answer, q.options?.length ?? 0)
            return (
              <li key={q.id}>
                <p className="text-ink-4 mb-2 text-[12px] font-bold tracking-wide uppercase">
                  {t('onlineExamsCopy.m186')}
                  {q.number}
                  {t('onlineExamsCopy.m130')}
                  {TYPE_LABEL[q.type]}
                  {t('onlineExamsCopy.m130')}
                  {formatPoints(q.points)}
                  {t('onlineExamsCopy.m66')}
                </p>
                <QuestionBody q={q} className="prose-exam text-[16px]" />

                {q.options?.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((o, i) => {
                      const ok = q.type === 'dung-sai' ? tf[i] : o.key === q.answer
                      return (
                        <li
                          key={o.key}
                          className={cn(
                            'flex gap-2 rounded-[6px] px-3 py-1.5 text-[15px]',
                            answers && ok ? 'bg-sage-soft text-sage' : 'bg-sunken/60 text-ink',
                          )}
                        >
                          <span className="font-semibold">
                            {q.type === 'dung-sai' ? `${o.key})` : `${o.key}.`}
                          </span>
                          <MathText as="span" className="inline">
                            {o.text}
                          </MathText>
                          {answers && q.type === 'dung-sai' ? (
                            <span className="ml-auto font-bold">
                              {tf[i] === null ? '?' : tf[i] ? t('onlineExamsCopy.m187') : 'Sai'}
                            </span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}

                {answers ? (
                  <div className="border-sage text-ink-2 mt-3 space-y-1 border-l-2 pl-3 text-[14px]">
                    {q.type === 'tra-loi-ngan' ? (
                      <p>
                        {t('onlineExamsCopy.m188')}
                        <b>{q.answer || t('onlineExamsCopy.m189')}</b>
                      </p>
                    ) : null}
                    {solutions.get(q.id)?.map((line) => (
                      <MathText key={line.id} as="div">
                        {line.text}
                      </MathText>
                    ))}
                    {q.explanation ? <MathText as="div">{q.explanation}</MathText> : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
  return null
}
export function OnlineBuilderToggleUi(
  props: ReturnType<typeof OnlineBuilderModel.useToggleContainer> & {
    parts: typeof OnlineBuilderParts
  },
) {
  if (props.viewState === 0) {
    const { checked, onChange, label, hint } = props
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="hover:bg-sunken/60 flex w-full items-start justify-between gap-4 rounded-[8px] px-4 py-3.5 text-left transition-colors"
      >
        <span>
          <span className="text-ink block text-[14px] font-semibold">{label}</span>
          <span className="text-ink-3 mt-0.5 block text-[12.5px] leading-relaxed">{hint}</span>
        </span>
        <span
          className={cn(
            'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
            checked ? 'bg-clay' : 'bg-line-2',
          )}
        >
          <span
            className={cn(
              'shadow-soft absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200',
              checked ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </span>
      </button>
    )
  }
  return null
}
export function OnlineBuilderIconBtnUi(
  props: ReturnType<typeof OnlineBuilderModel.useIconBtnContainer> & {
    parts: typeof OnlineBuilderParts
  },
) {
  if (props.viewState === 0) {
    const { label, onClick, disabled, danger, children } = props
    return (
      <button
        type="button"
        aria-label={label}
        data-tip={label}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'text-ink-3 flex size-9 items-center justify-center rounded-[6px] transition-colors disabled:pointer-events-none disabled:opacity-30',
          danger ? 'hover:bg-clay-soft hover:text-clay' : 'hover:bg-sunken hover:text-ink',
        )}
      >
        {children}
      </button>
    )
  }
  return null
}
export function OnlineBuilderQuestionEditorUi(
  props: ReturnType<typeof OnlineBuilderModel.useQuestionEditorContainer> & {
    parts: typeof OnlineBuilderParts
  },
) {
  const { IconBtn } = props.parts
  if (props.viewState === 0) {
    const {
      q,
      onMove,
      canUp,
      canDown,
      onDuplicate,
      onRemove,
      type,
      onType,
      onPatch,
      setImage,
      imgBusy,
      imgError,
      options,
      setOption,
      removeOption,
      tf,
      issue,
    } = props
    return (
      <Card className="min-w-0 rounded-xl p-4 sm:p-6">
        <div className="border-line mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <p className="font-display text-ink text-[18px] font-semibold">
            {t('onlineExamsCopy.m186')}
            {q.number}
          </p>
          <div className="flex items-center">
            <IconBtn label={t('onlineExamsCopy.m190')} onClick={() => onMove(-1)} disabled={!canUp}>
              <ArrowUp className="size-4" />
            </IconBtn>
            <IconBtn
              label={t('onlineExamsCopy.m191')}
              onClick={() => onMove(1)}
              disabled={!canDown}
            >
              <ArrowDown className="size-4" />
            </IconBtn>
            <IconBtn label={t('onlineExamsCopy.m192')} onClick={onDuplicate}>
              <Copy className="size-4" />
            </IconBtn>
            <IconBtn label={t('onlineExamsCopy.m193')} onClick={onRemove} danger>
              <TrashIcon className="size-4" />
            </IconBtn>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label={t('onlineExamsCopy.m194')}
          className="mb-6 flex flex-wrap gap-1.5"
        >
          {ONLINE_TYPES.map((questionType) => (
            <button
              key={questionType}
              type="button"
              role="radio"
              aria-checked={type === questionType}
              onClick={() => onType(questionType)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                type === questionType ? 'bg-ink text-paper' : 'bg-sunken text-ink-2 hover:text-ink',
              )}
            >
              {TYPE_LABEL[questionType]}
            </button>
          ))}
        </div>

        <Field label={t('onlineExamsCopy.m195')} hint={t('onlineExamsCopy.m196')}>
          <textarea
            rows={3}
            className={textareaClass}
            value={q.prompt}
            onChange={(e) => onPatch({ prompt: e.target.value })}
            onPaste={(e) => {
              const f = pastedImage(e)
              if (!f) return
              e.preventDefault()
              void setImage(f)
            }}
            placeholder={t('onlineExamsCopy.m197')}
          />
        </Field>
        <QuestionImageField
          image={q.image}
          onChange={(image) => onPatch({ image })}
          busy={imgBusy}
          error={imgError}
          pick={(f) => void setImage(f)}
        />
        {q.prompt.includes('$') || q.image?.src ? (
          <div className="bg-sunken/70 text-ink mt-2 rounded-[6px] px-4 py-3 text-[15px]">
            <QuestionBody q={q} />
          </div>
        ) : null}

        {type === 'trac-nghiem' ? (
          <div className="mt-6">
            <p className="eyebrow mb-2">{t('onlineExamsCopy.m198')}</p>
            <ul className="space-y-2">
              {options.map((o, i) => {
                const right = q.answer === o.key
                return (
                  <li key={o.key} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label={t('onlineExamsCopy.m199', { value0: o.key })}
                      aria-pressed={right}
                      onClick={() => onPatch({ answer: o.key })}
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold transition-colors',
                        right
                          ? 'border-sage bg-sage text-white'
                          : 'border-line-2 text-ink-3 hover:border-ink-4 bg-white',
                      )}
                    >
                      {right ? <Check className="size-4" strokeWidth={3} /> : o.key}
                    </button>
                    <input
                      className={inputClass}
                      value={o.text}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={t('onlineExamsCopy.m200', { value0: o.key })}
                      aria-label={t('onlineExamsCopy.m200', { value0: o.key })}
                    />
                    <IconBtn
                      label={t('onlineExamsCopy.m201', { value0: o.key })}
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      danger
                    >
                      <TrashIcon className="size-4" />
                    </IconBtn>
                  </li>
                )
              })}
            </ul>
            {options.length < KEYS.length ? (
              <button
                type="button"
                onClick={() =>
                  onPatch({ options: [...options, { key: KEYS[options.length]!, text: '' }] })
                }
                className="text-ink-3 hover:text-ink mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              >
                <Plus className="size-3.5" />
                {t('onlineExamsCopy.m202')}
              </button>
            ) : null}
          </div>
        ) : null}

        {type === 'dung-sai' ? (
          <div className="mt-6">
            <p className="eyebrow mb-2">{t('onlineExamsCopy.m203')}</p>
            <ul className="space-y-2">
              {options.map((o, i) => (
                <li key={o.key} className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                  <span className="border-line-2 text-ink-3 flex size-9 shrink-0 items-center justify-center rounded-full border bg-white text-[13px] font-bold">
                    {o.key}
                  </span>
                  <input
                    className={inputClass + ' min-w-0 flex-1'}
                    value={o.text}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={t('onlineExamsCopy.m204', { value0: o.key })}
                    aria-label={t('onlineExamsCopy.m205', { value0: o.key })}
                  />
                  <span className="flex shrink-0 gap-1.5">
                    {([true, false] as const).map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        aria-pressed={tf[i] === v}
                        onClick={() =>
                          onPatch({ answer: formatTrueFalse(tf.map((x, j) => (j === i ? v : x))) })
                        }
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                          tf[i] === v
                            ? v
                              ? 'border-sage bg-sage text-white'
                              : 'border-clay bg-clay text-white'
                            : 'border-line-2 text-ink-3 hover:border-ink-4 hover:text-ink bg-white',
                        )}
                      >
                        {v ? t('onlineExamsCopy.m187') : 'Sai'}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {type === 'tra-loi-ngan' ? (
          <div className="mt-6">
            <Field
              label={t('onlineExamsCopy.m206')}
              hint={t('onlineExamsCopy.m207', { value0: SHORT_MAX_CHARS })}
            >
              <input
                className={
                  inputClass + ' max-w-[180px] text-center font-mono text-[18px] tracking-[0.3em]'
                }
                inputMode="decimal"
                maxLength={SHORT_MAX_CHARS}
                value={q.answer ?? ''}
                onChange={(e) =>
                  onPatch({
                    answer: e.target.value
                      .replaceAll('.', ',')
                      .replaceAll(/[^0-9,-]/g, '')
                      .slice(0, SHORT_MAX_CHARS),
                  })
                }
              />
            </Field>
          </div>
        ) : null}

        <div className="mt-6">
          {type === 'tu-luan' ? (
            <Field label={t('onlineExamsCopy.m208')} hint={t('onlineExamsCopy.m209')}>
              <textarea
                rows={4}
                className={textareaClass}
                value={(q.solution ?? []).join('\n')}
                onChange={(e) =>
                  onPatch({ solution: e.target.value ? e.target.value.split('\n') : undefined })
                }
              />
            </Field>
          ) : (
            <Field label={t('onlineExamsCopy.m210')} hint={t('onlineExamsCopy.m211')}>
              <textarea
                rows={3}
                className={textareaClass}
                value={q.explanation ?? ''}
                onChange={(e) => onPatch({ explanation: e.target.value || undefined })}
              />
            </Field>
          )}
        </div>

        <div className="border-line-2 mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <Field label={t('onlineExamsCopy.m212')} className="w-[120px]">
            <input
              type="number"
              min={0}
              step={0.25}
              className={inputClass}
              value={q.points}
              onChange={(e) => onPatch({ points: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
          {issue ? (
            <p
              role="status"
              className="bg-clay-soft text-clay rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            >
              {issue}
            </p>
          ) : (
            <p className="bg-sage-soft text-sage rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold">
              {t('onlineExamsCopy.m213')}
            </p>
          )}
        </div>
      </Card>
    )
  }
  return null
}
