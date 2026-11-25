'use client'
import { lib_math_formatPoints as formatPoints, Link } from '@community-engine'
import { cn } from '@workspace/ui/lib/utils'
import { Clock, MonitorPlay, Search, Sparkles, Upload, Users, X } from 'lucide-react'

import {
  Avatar,
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  FilterChips,
  inputClass,
  PageHeader,
  Pager,
  PageShell,
  SiteSelect,
  SkeletonCard,
  Toolbar,
} from '@/components/product-ui'
import { MathText } from '@/components/student-kernel'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-community'
import { CommunityModel } from '@/modules/community/hooks'

import type {
  CommunityParts as Imported0,
  CommunityParts as Imported1,
  CommunityParts as Imported2,
  CommunityParts as Imported3,
  CommunityParts as Imported4,
  CommunityParts as Imported5,
} from '@/modules/community/containers/community-container/community-container'
const { SUBJECT_OPTIONS, GRADE_OPTIONS, SORT_OPTIONS, keyLabel, formatDate } = CommunityModel
export function CommunityUi(
  props: ReturnType<typeof CommunityModel.useCommunityContainer> & {
    parts: typeof Imported0
  },
) {
  const { PublishModal, ExamCard, ExamRow, ViewToggle } = props.parts
  if (props.viewState === 0) {
    const {
      results,
      setPublishOpen,
      publishOpen,
      session,
      loadDocs,
      q,
      setQ,
      subject,
      setSubject,
      grade,
      setGrade,
      sort,
      setSort,
      view,
      setView,
      hasFilter,
      clearFilters,
      openError,
      loading,
      paged,
      openingId,
    } = props
    return (
      <PageShell>
        <PageHeader
          eyebrow={t('communityCopy.m409')}
          title={t('communityCopy.m410')}
          description=""
          count={
            <>
              {results.length}
              {t('communityCopy.m79')}
            </>
          }
          actions={
            <Button variant="primary" onClick={() => setPublishOpen(true)}>
              <Upload className="size-4" />
              {t('communityCopy.m411')}
            </Button>
          }
        />

        {publishOpen ? (
          <PublishModal
            loggedIn={Boolean(session)}
            onClose={() => setPublishOpen(false)}
            onPublished={loadDocs}
          />
        ) : null}

        <Toolbar className="flex-col items-stretch">
          <div className="relative min-w-0 flex-1">
            <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('communityCopy.m412')}
              className={inputClass + ' pl-11'}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SiteSelect
              value={subject}
              options={SUBJECT_OPTIONS}
              onChange={setSubject}
              label={t('communityCopy.m413')}
              className="min-w-0 flex-[1_1_130px] sm:w-[170px] sm:flex-none"
            />
            <SiteSelect
              value={grade}
              options={GRADE_OPTIONS}
              onChange={setGrade}
              label={t('communityCopy.m414')}
              className="min-w-0 flex-[1_1_120px] sm:w-[150px] sm:flex-none"
            />
            <SiteSelect
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
              label={t('communityCopy.m40')}
              className="min-w-0 flex-[1_1_110px] sm:w-[150px] sm:flex-none"
            />

            <ViewToggle value={view} onChange={setView} />
          </div>
        </Toolbar>

        <FilterChips className="mb-5">
          {hasFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className="bg-clay-soft text-clay hover:bg-clay/15 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors"
            >
              <X className="size-3" />
              {t('communityCopy.m415')}
            </button>
          ) : null}
        </FilterChips>

        {openError ? (
          <p role="alert" className="text-clay-deep mb-6 text-[13.5px] font-medium">
            {openError}
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} variant="exam" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search className="size-6" strokeWidth={1.6} />}
            title={t('communityCopy.m47')}
            description={t('communityCopy.m416')}
            action={
              <Button variant="outline" onClick={clearFilters}>
                {t('communityCopy.m417')}
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.items.map((it, i) => (
              <ExamCard
                key={`${it.mine ? 'u' : 's'}-${it.id}`}
                item={it}
                index={i}
                busy={openingId === it.id}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden rounded-xl">
            {paged.items.map((it) => (
              <ExamRow
                key={`${it.mine ? 'u' : 's'}-${it.id}`}
                item={it}
                busy={openingId === it.id}
              />
            ))}
          </Card>
        )}
        <Pager {...paged} />
      </PageShell>
    )
  }
  return null
}
export function CommunityPublishModalUi(
  props: ReturnType<typeof CommunityModel.usePublishModalContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const { onClose, loggedIn, docs, online, busyId, publishLocalDoc, publishOnline, error } = props
    return (
      <div
        className="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center px-5 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('communityCopy.m411')}
          className="anim-pop bg-surface shadow-float w-full max-w-[520px] rounded-[8px] p-7"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-ink text-[22px] font-semibold">
                {t('communityCopy.m418')}
              </h2>
              <p className="text-ink-3 mt-1.5 text-[14px]">{t('communityCopy.m419')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-sunken text-ink-3 hover:text-ink flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
              aria-label={t('communityCopy.m329')}
            >
              <X className="size-4" />
            </button>
          </div>

          {loggedIn ? (
            docs.length === 0 && online.length === 0 ? (
              <div className="mt-7 space-y-5">
                <p className="text-ink-2 text-[14.5px]">{t('communityCopy.m421')}</p>
                <Link to={appPaths.editor.href}>
                  <Button variant="outline">{t('communityCopy.m422')}</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-line mt-6 max-h-[360px] divide-y overflow-y-auto">
                {online.map((it) => (
                  <li key={`o-${it.id}`} className="flex items-center gap-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-[15px] font-semibold">
                        {it.meta.title.trim() || t('communityCopy.m91')}
                      </p>
                      <p className="text-ink-3 mt-0.5 text-[12.5px]">
                        {t('communityCopy.m423')}
                        {it.meta.subject}
                        {t('communityCopy.m130')}
                        {it.meta.grade}
                        {t('communityCopy.m130')}
                        {it.questions.length}
                        {t('communityCopy.m65')}
                        {it.publishedId && it.publishedListed !== false
                          ? t('communityCopy.m424')
                          : ''}
                      </p>
                    </div>
                    <Button
                      variant="clay"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => void publishOnline(it.id)}
                    >
                      {busyId === it.id
                        ? t('communityCopy.m102')
                        : it.publishedId && it.publishedListed !== false
                          ? t('communityCopy.m425')
                          : t('communityCopy.m103')}
                    </Button>
                  </li>
                ))}
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-[15px] font-semibold">{d.title}</p>
                      <p className="text-ink-3 mt-0.5 text-[12.5px]">
                        {d.subject}
                        {t('communityCopy.m130')}
                        {d.grade}
                        {t('communityCopy.m130')}
                        {d.blocks.length}
                        {t('communityCopy.m426')}
                      </p>
                    </div>
                    <Button
                      variant="clay"
                      size="sm"
                      disabled={busyId !== null || d.blocks.length === 0}
                      data-tip={d.blocks.length === 0 ? t('communityCopy.m427') : undefined}
                      onClick={() => void publishLocalDoc(d.id)}
                    >
                      {busyId === d.id ? t('communityCopy.m102') : t('communityCopy.m103')}
                    </Button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="mt-7 space-y-5">
              <p className="text-ink-2 text-[14.5px]">{t('communityCopy.m420')}</p>
              <Link to={appPaths.auth.login.href}>
                <Button variant="primary">{t('communityCopy.m107')}</Button>
              </Link>
            </div>
          )}

          {error ? (
            <p role="alert" className="text-clay-deep mt-4 text-[13.5px] font-medium">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    )
  }
  return null
}
export function CommunityExamCardUi(
  props: ReturnType<typeof CommunityModel.useExamCardContainer> & {
    parts: typeof Imported2
  },
) {
  const { KeyBadge } = props.parts
  if (props.viewState === 0) {
    const { index, item, busy, authorName } = props
    return (
      <Card
        asChild
        className="anim-delay group hover:shadow-lift flex min-w-0 flex-col overflow-hidden rounded-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <article style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}>
          <button
            type="button"
            onClick={item.onView}
            disabled={busy}
            className="border-line bg-sunken/50 relative flex min-h-36 w-full flex-col justify-between gap-4 overflow-hidden border-b p-5 text-left"
          >
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="clay">{item.subject}</Badge>
                {item.mine ? <Badge tone="honey">{t('communityCopy.m407')}</Badge> : null}
                {item.mine ? <Badge tone="sage">{t('communityCopy.m428')}</Badge> : null}
                <KeyBadge item={item} />
              </div>
              <span className="text-ink-3 shrink-0 text-[12px] font-semibold">{item.grade}</span>
            </div>
            <div className="relative min-w-0">
              <p
                data-tip={item.title}
                className="font-display text-ink line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em]"
              >
                {item.title}
              </p>
              <p className="text-ink-3 mt-1 truncate text-[12px]">
                {item.school || t('communityCopy.m92')}
              </p>
            </div>
          </button>

          <div className="flex flex-1 flex-col p-5">
            {item.author ? (
              <div className="mb-3 flex min-w-0 items-center gap-2">
                <Avatar
                  src={item.author.avatar}
                  name={authorName}
                  className="size-6 shrink-0 text-[11px]"
                  fallbackClassName="bg-clay-tint font-semibold text-clay"
                />
                <span
                  data-tip={authorName}
                  className="text-ink-2 min-w-0 truncate text-[12.5px] font-medium"
                >
                  {authorName}
                </span>
              </div>
            ) : null}

            <div className="text-ink-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] font-medium">
              <span className="tnum flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="size-3.5 shrink-0" />
                {item.questions}
                {t('communityCopy.m65')}
              </span>
              <span className="tnum flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="size-3.5 shrink-0" />
                {item.minutes}
                {t('communityCopy.m248')}
              </span>
              <span className="tnum whitespace-nowrap">
                {formatPoints(item.points)}
                {t('communityCopy.m66')}
              </span>
            </div>

            {item.preview ? (
              <p className="text-ink-3 mt-3 line-clamp-2 text-[13px] leading-relaxed">
                <MathText as="span" className="inline">
                  {item.preview}
                </MathText>
              </p>
            ) : null}

            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <Button
                variant="soft"
                size="sm"
                className="w-full justify-center px-2.5 whitespace-nowrap sm:px-3.5"
                onClick={item.onView}
                disabled={busy}
              >
                {t('communityCopy.m429')}
              </Button>
              <Button
                variant="clay"
                size="sm"
                className="w-full justify-center px-2.5 whitespace-nowrap sm:px-3.5"
                onClick={item.onQuiz}
                disabled={busy}
                data-tip={t('communityCopy.m72')}
              >
                <MonitorPlay className="size-3.5 shrink-0" />
                {busy ? t('communityCopy.m430') : t('communityCopy.m57')}
              </Button>
            </div>
          </div>
        </article>
      </Card>
    )
  }
  return null
}
export function CommunityKeyBadgeUi(
  props: ReturnType<typeof CommunityModel.useKeyBadgeContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    return null
  }
  if (props.viewState === 1) {
    const { item } = props
    return (
      <span data-tip={t('communityCopy.m431')}>
        <Badge tone="outline">{keyLabel(item)}</Badge>
      </span>
    )
  }
  return null
}
export function CommunityExamRowUi(
  props: ReturnType<typeof CommunityModel.useExamRowContainer> & {
    parts: typeof Imported4
  },
) {
  if (props.viewState === 0) {
    const { item, busy, authorName } = props
    return (
      <div className="border-line-2 hover:bg-canvas/60 flex flex-col gap-3 border-b px-5 py-4 last:border-0 md:flex-row md:items-center md:gap-4">
        <button
          type="button"
          onClick={item.onView}
          disabled={busy}
          className="min-w-0 flex-1 text-left"
        >
          <span
            data-tip={item.title}
            className="font-display text-ink hover:text-clay line-clamp-2 text-[16px] font-semibold transition-colors"
          >
            {item.title}
            {item.mine ? (
              <span className="text-honey ml-2 inline-block align-middle text-[11.5px] font-semibold whitespace-nowrap">
                {t('communityCopy.m407')}
              </span>
            ) : null}
            {item.mine ? (
              <Badge tone="sage" className="ml-2 align-middle">
                {t('communityCopy.m428')}
              </Badge>
            ) : null}
            {item.missingKeys ? (
              <span className="text-ink-3 ml-2 inline-block align-middle text-[11.5px] font-semibold whitespace-nowrap">
                {keyLabel(item)}
              </span>
            ) : null}
          </span>
          <span className="text-ink-3 mt-1.5 flex min-w-0 items-center gap-1.5 text-[12px]">
            {item.author ? (
              <>
                <Avatar
                  src={item.author.avatar}
                  name={authorName}
                  className="size-5 shrink-0 text-[10px]"
                  fallbackClassName="bg-clay-tint font-semibold text-clay"
                />
                <span
                  data-tip={authorName}
                  className="text-ink-2 max-w-[45%] min-w-0 shrink truncate font-medium"
                >
                  {authorName}
                </span>
                <span aria-hidden="true" className="text-ink-4 shrink-0">
                  {t('communityCopy.m64')}
                </span>
              </>
            ) : null}
            <span className="min-w-0 flex-1 truncate">
              {item.school || t('communityCopy.m92')}
              {t('communityCopy.m130')}
              {item.subject}
              {t('communityCopy.m130')}
              {item.grade}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3 md:shrink-0 md:flex-nowrap md:gap-4">
          <div className="text-ink-3 flex items-center gap-3.5 text-[12.5px] font-medium whitespace-nowrap">
            <span className="tnum">
              {item.questions}
              {t('communityCopy.m65')}
            </span>
            <span className="tnum">
              {item.minutes}
              {t('communityCopy.m248')}
            </span>
            {item.mine ? (
              <span className="tnum hidden sm:inline">{formatDate(item.date ?? '')}</span>
            ) : (
              <span className="tnum flex items-center gap-1.5">
                <Users className="size-3.5" />
                {item.views ?? 0}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap"
              onClick={item.onView}
              disabled={busy}
            >
              {t('communityCopy.m432')}
            </Button>
            <Button
              variant="clay"
              size="sm"
              className="whitespace-nowrap"
              onClick={item.onQuiz}
              disabled={busy}
            >
              <MonitorPlay className="size-3.5 shrink-0" />
              {busy ? t('communityCopy.m430') : t('communityCopy.m57')}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return null
}
export function CommunityViewToggleUi(
  props: ReturnType<typeof CommunityModel.useViewToggleContainer> & {
    parts: typeof Imported5
  },
) {
  if (props.viewState === 0) {
    const { ref, thumb, options, value, onChange } = props
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={t('communityCopy.m433')}
        className="bg-sunken relative flex h-11 shrink-0 items-center rounded-[8px] p-[3px]"
      >
        {thumb ? (
          <span
            aria-hidden
            className="bg-surface shadow-soft absolute inset-y-[3px] left-0 rounded-[6px] transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
          />
        ) : null}
        {options.map(({ key, label, Icon }) => {
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              data-tip={label}
              onClick={() => onChange(key)}
              className={cn(
                'relative z-10 flex h-full w-11 items-center justify-center rounded-[6px] transition-colors duration-200 active:scale-[0.96]',
                active ? 'text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    )
  }
  return null
}
