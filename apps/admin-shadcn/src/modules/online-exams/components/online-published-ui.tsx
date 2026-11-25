'use client'

import {
  lib_math_formatPoints as formatPoints,
  Link,
  lib_onlinePublish_shareUrl as shareUrl,
  components_appIcons_TrashIcon as TrashIcon,
} from '@online-exams-engine'
import { cn } from '@workspace/ui/lib/utils'
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Crown,
  Globe2,
  Link2,
  Lock,
  Sparkles,
} from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  CopyLink,
  EmptyState,
  PageHeader,
  Pager,
  PageShell,
  SkeletonCard,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { PageSkeleton } from '@/components/page-skeleton'
import { OnlinePublishedModel } from '@/modules/online-exams/hooks'

import type { OnlinePublishedParts } from '@/modules/online-exams/containers/online-published-container'
const { fmt, mmss, BAND_LABEL, BAND_COLOR, MEDAL, PODIUM_H } = OnlinePublishedModel
export function OnlinePublishedPublishedPanelUi(
  props: ReturnType<typeof OnlinePublishedModel.usePublishedPanelContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  const { PublishedCard } = props.parts
  if (props.viewState === 0) {
    return (
      <EmptyState
        icon={<Lock className="size-6" strokeWidth={1.6} />}
        title={t('onlineExamsCopy.m244')}
        action={
          <Link to={appPaths.auth.login.href}>
            <Button variant="primary">{t('onlineExamsCopy.m107')}</Button>
          </Link>
        }
      />
    )
  }
  if (props.viewState === 1) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {['first', 'second', 'third'].map((key) => (
          <SkeletonCard key={key} variant="exam" />
        ))}
      </div>
    )
  }
  if (props.viewState === 2) {
    const {
      error,
      rows,
      stats,
      busyId,
      items,
      onResults,
      onEdit,
      toggleListed,
      remove,
      page,
      pages,
      go,
    } = props
    return (
      <>
        {error ? (
          <p role="alert" className="text-clay-deep mb-6 text-[13.5px] font-medium">
            {error}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-6" strokeWidth={1.6} />}
            title={t('onlineExamsCopy.m245')}
            description={t('onlineExamsCopy.m246')}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, i) => (
              <PublishedCard
                key={row.id}
                row={row}
                index={i}
                stats={stats.get(row.id)}
                busy={busyId === row.id}
                localId={items.find((it) => it.publishedId === row.id)?.id}
                onResults={() => onResults(row.id)}
                onToggleListed={() => void toggleListed(row)}
                onRemove={() => void remove(row)}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
        <Pager page={page} pages={pages} go={go} />
      </>
    )
  }
  return null
}
export function OnlinePublishedPublishedCardUi(
  props: ReturnType<typeof OnlinePublishedModel.usePublishedCardContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  const { IconBtn, Stat, Bands } = props.parts
  if (props.viewState === 0) {
    const {
      index,
      onResults,
      row,
      stats,
      total,
      localId,
      onEdit,
      copy,
      url,
      copied,
      onToggleListed,
      busy,
      onRemove,
    } = props
    return (
      <Card
        asChild
        className="anim-delay group hover:shadow-lift flex min-w-0 flex-col overflow-hidden rounded-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <article style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}>
          <button
            type="button"
            onClick={onResults}
            className="bg-sunken/70 relative flex h-[140px] w-full flex-col justify-between overflow-hidden p-5 text-left"
          >
            <div
              className="pointer-events-none absolute -top-14 -right-10 size-40 rounded-full opacity-70 blur-2xl transition-transform duration-700 group-hover:scale-125"
              style={{
                background: 'radial-gradient(circle, rgba(192,90,60,0.2), transparent 70%)',
              }}
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="clay">{row.subject}</Badge>
                {row.listed ? (
                  <Badge tone="sage">{t('onlineExamsCopy.m88')}</Badge>
                ) : (
                  <Badge tone="honey">{t('onlineExamsCopy.m247')}</Badge>
                )}
              </div>
              <span className="text-ink-3 text-[12px] font-semibold">{row.grade}</span>
            </div>
            <div className="relative">
              <p
                data-tip={row.title}
                className="font-display text-ink line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em]"
              >
                {row.title.trim() || t('onlineExamsCopy.m91')}
              </p>
              <p className="text-ink-3 mt-1 truncate text-[12px]">
                {row.school || t('onlineExamsCopy.m92')}
              </p>
            </div>
          </button>

          <div className="flex flex-1 flex-col p-5">
            <div className="text-ink-3 flex items-center gap-3.5 text-[12px] font-medium">
              <span className="tnum flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                {row.question_count}
                {t('onlineExamsCopy.m65')}
              </span>
              <span className="tnum flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {row.duration_minutes}
                {t('onlineExamsCopy.m248')}
              </span>
              <span className="tnum">
                {formatPoints(row.total_points)}
                {t('onlineExamsCopy.m66')}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              <Stat label={t('onlineExamsCopy.m249')} value={String(stats?.attempts ?? 0)} />
              <Stat label={t('onlineExamsCopy.m250')} value={String(total)} />
              <Stat label={t('onlineExamsCopy.m251')} value={total ? fmt(stats!.avg) : '–'} />
            </dl>

            {total ? <Bands bands={stats!.bands} /> : null}

            {total ? null : (
              <p className="text-ink-3 mt-4 text-[13px] leading-relaxed">
                {t('onlineExamsCopy.m252')}
              </p>
            )}

            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <Button variant="soft" size="sm" onClick={onResults}>
                <BarChart3 className="size-3.5" />
                {t('onlineExamsCopy.m253')}
              </Button>
              {localId ? (
                <Button variant="soft" size="sm" onClick={() => onEdit(localId)}>
                  {t('onlineExamsCopy.m96')}
                </Button>
              ) : (
                <Link to={appPaths.play.getHref(row.id)} className="contents">
                  <Button variant="soft" size="sm">
                    {t('onlineExamsCopy.m254')}
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="clay"
                size="sm"
                className="min-w-0 flex-1"
                onClick={copy}
                data-tip={url}
              >
                {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
                {copied ? t('onlineExamsCopy.m255') : t('onlineExamsCopy.m256')}
              </Button>
              <IconBtn
                label={row.listed ? t('onlineExamsCopy.m257') : t('onlineExamsCopy.m258')}
                onClick={onToggleListed}
                disabled={busy}
              >
                <Globe2 className={cn('size-4', row.listed && 'text-sage')} />
              </IconBtn>
              <IconBtn label={t('onlineExamsCopy.m241')} onClick={onRemove} disabled={busy} danger>
                <TrashIcon className="size-4" />
              </IconBtn>
            </div>
          </div>
        </article>
      </Card>
    )
  }
  return null
}
export function OnlinePublishedIconBtnUi(
  props: ReturnType<typeof OnlinePublishedModel.useIconBtnContainer> & {
    parts: typeof OnlinePublishedParts
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
          'text-ink-3 flex size-9 shrink-0 items-center justify-center rounded-[6px] transition-colors disabled:pointer-events-none disabled:opacity-40',
          danger ? 'hover:bg-clay-soft hover:text-clay' : 'hover:bg-sunken hover:text-ink',
        )}
      >
        {children}
      </button>
    )
  }
  return null
}
export function OnlinePublishedStatUi(
  props: ReturnType<typeof OnlinePublishedModel.useStatContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  if (props.viewState === 0) {
    const { label, value } = props
    return (
      <Card asChild className="min-w-0 rounded-xl p-3">
        <div>
          <dt className="text-ink-3 text-xs">{label}</dt>
          <dd className="tnum font-display text-ink mt-2 text-xl leading-none font-semibold">
            {value}
          </dd>
        </div>
      </Card>
    )
  }
  return null
}
export function OnlinePublishedBandsUi(
  props: ReturnType<typeof OnlinePublishedModel.useBandsContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  if (props.viewState === 0) {
    const { bands, sum } = props
    return (
      <div
        className="bg-sunken mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={t('onlineExamsCopy.m260', {
          value0: bands
            .map((n, i) => t('onlineExamsCopy.m259', { value0: BAND_LABEL[i] ?? '', value1: n }))
            .join(', '),
        })}
      >
        {bands.map((n, i) =>
          n ? (
            <span
              key={BAND_LABEL[i]}
              className={BAND_COLOR[i]}
              style={{ width: `${(n / sum) * 100}%` }}
              data-tip={t('onlineExamsCopy.m261', { value0: BAND_LABEL[i] ?? '', value1: n })}
            />
          ) : null,
        )}
      </div>
    )
  }
  return null
}
export function OnlinePublishedPodiumUi(
  props: ReturnType<typeof OnlinePublishedModel.usePodiumContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  if (props.viewState === 0) {
    const { order, top } = props
    return (
      <section
        aria-label={t('onlineExamsCopy.m262')}
        className="bg-sunken/50 mt-8 rounded-[8px] px-3 pt-6 sm:px-8"
      >
        <ol className="mx-auto flex max-w-[560px] items-end justify-center gap-2 sm:gap-4">
          {order.map((i) => {
            const s = top[i]
            const m = MEDAL[i]
            if (!s || !m) return null
            const first = i === 0
            return (
              <li
                key={s.name + i}
                className={cn('flex min-w-0 flex-1 flex-col items-center', first && 'z-10')}
              >
                {first ? (
                  <Crown
                    className="text-honey mb-1 size-7 drop-shadow-[0_2px_6px_rgba(184,134,47,0.45)]"
                    fill="currentColor"
                  />
                ) : null}
                <span
                  className={cn(
                    'tnum font-display flex shrink-0 items-center justify-center rounded-full font-bold',
                    first ? 'size-16 text-[26px]' : 'size-12 text-[19px]',
                  )}
                  style={{
                    background: m.fill,
                    color: m.text,
                    boxShadow: `0 0 0 3px ${m.ring}33, 0 6px 14px ${m.ring}55`,
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className={cn(
                    'text-ink mt-2 w-full truncate text-center font-semibold',
                    first ? 'text-[16px]' : 'text-[13.5px]',
                  )}
                  data-tip={s.name}
                >
                  {s.name}
                </p>
                <p
                  className={cn(
                    'tnum font-display font-semibold',
                    first ? 'text-honey text-[22px]' : 'text-ink-2 text-[16px]',
                  )}
                >
                  {formatPoints(s.best)}
                  <span className="text-ink-4 text-[12px] font-normal">
                    {t('onlineExamsCopy.m263')}
                    {formatPoints(s.max)}
                  </span>
                </p>
                <div
                  className={cn(
                    'mt-2 flex w-full items-start justify-center rounded-t-[6px] pt-2 text-[12px] font-semibold',
                    PODIUM_H[i],
                    first
                      ? 'bg-honey-soft text-honey shadow-[0_-8px_24px_rgba(184,134,47,0.25)]'
                      : 'bg-surface text-ink-3',
                  )}
                >
                  {mmss(s.seconds)}
                  {t('onlineExamsCopy.m130')}
                  {s.attempts}
                  {t('onlineExamsCopy.m264')}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    )
  }
  return null
}
export function OnlinePublishedOnlineResultsUi(
  props: ReturnType<typeof OnlinePublishedModel.useOnlineResultsContainer> & {
    parts: typeof OnlinePublishedParts
  },
) {
  const { Stat, Podium } = props.parts
  if (props.viewState === 0) {
    const { session, demo, isLoading, error, row, students, studentRows, stats } = props
    return (
      <PageShell>
        <Link
          to={appPaths.onlineExams.href + '?tab=published'}
          className="text-ink-3 hover:text-ink mb-8 inline-flex items-center gap-2 text-[13.5px] font-semibold transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t('onlineExamsCopy.m84')}
        </Link>

        {!session && !demo && !isLoading ? (
          <EmptyState
            icon={<Lock className="size-6" strokeWidth={1.6} />}
            title={t('onlineExamsCopy.m265')}
            description=""
            action={
              <Link to={appPaths.auth.login.href}>
                <Button variant="primary">{t('onlineExamsCopy.m107')}</Button>
              </Link>
            }
          />
        ) : error ? (
          <p role="alert" className="text-clay-deep text-[13.5px] font-medium">
            {error}
          </p>
        ) : row === undefined ? (
          <PageSkeleton variant="dashboard" />
        ) : row === null ? (
          <EmptyState
            icon={<Sparkles className="size-6" strokeWidth={1.6} />}
            title={t('onlineExamsCopy.m266')}
            description={t('onlineExamsCopy.m267')}
          />
        ) : (
          <div className="min-w-0">
            <PageHeader
              title={row.title.trim() || t('onlineExamsCopy.m91')}
              count={
                <>
                  {row.subject}
                  {t('onlineExamsCopy.m130')}
                  {row.grade}
                  {t('onlineExamsCopy.m130')}
                  {row.question_count}
                  {t('onlineExamsCopy.m65')}
                </>
              }
              description={t('onlineExamsCopy.m268')}
              actions={<CopyLink url={shareUrl(row.id)} className="w-full sm:w-[320px]" />}
            />

            {students.length === 0 ? (
              <EmptyState
                title={t('onlineExamsCopy.m269')}
                description={t('onlineExamsCopy.m270')}
              />
            ) : (
              <>
                <dl className="[&>div]:border-line [&>div]:bg-surface my-6 grid grid-cols-2 gap-3 sm:grid-cols-4 [&_dd]:mt-2 [&_dd]:text-2xl [&>div]:rounded-xl [&>div]:border [&>div]:p-4 [&>div]:text-left [&>div]:shadow-sm">
                  <Stat label={t('onlineExamsCopy.m249')} value={String(stats!.attempts)} />
                  <Stat label={t('onlineExamsCopy.m250')} value={String(students.length)} />
                  <Stat label={t('onlineExamsCopy.m271')} value={fmt(stats!.avg)} />
                  <Stat label={t('onlineExamsCopy.m272')} value={formatPoints(students[0]!.best)} />
                </dl>

                <ul className="text-ink-2 mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] sm:grid-cols-4">
                  {stats!.bands.map((n, i) => (
                    <li key={BAND_LABEL[i]} className="flex items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', BAND_COLOR[i])} />
                      <span className="truncate">{BAND_LABEL[i]}</span>
                      <span className="tnum text-ink ml-auto font-semibold">{n}</span>
                    </li>
                  ))}
                </ul>

                <Podium top={stats!.top} />

                <Card className="mt-6 min-w-0 overflow-x-auto rounded-xl">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="bg-sunken text-ink-4 sticky top-0 text-[11.5px] font-bold tracking-wide whitespace-nowrap uppercase">
                      <tr>
                        <th className="w-10 px-3 py-2">{t('onlineExamsCopy.m273')}</th>
                        <th className="px-3 py-2">{t('onlineExamsCopy.m274')}</th>
                        <th className="px-3 py-2">{t('onlineExamsCopy.m144')}</th>
                        <th className="px-3 py-2 text-right">{t('onlineExamsCopy.m275')}</th>
                        <th className="px-3 py-2 text-right">{t('onlineExamsCopy.m212')}</th>
                        <th className="px-3 py-2 text-right">{t('onlineExamsCopy.m276')}</th>
                        <th className="hidden px-3 py-2 text-right sm:table-cell">
                          {t('onlineExamsCopy.m277')}
                        </th>
                        <th className="hidden px-3 py-2 text-right sm:table-cell">
                          {t('onlineExamsCopy.m278')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRows.map(({ id, student: s, rank }) => (
                        <tr key={id} className="border-line border-t">
                          <td className="tnum text-ink-3 px-3 py-2">{rank}</td>
                          <td className="text-ink max-w-[160px] truncate px-3 py-2 font-medium">
                            {s.name}
                          </td>
                          <td className="text-ink-2 px-3 py-2 whitespace-nowrap">
                            {s.className || '–'}
                          </td>
                          <td className="tnum text-ink-2 px-3 py-2 text-right">{s.seat ?? '–'}</td>
                          <td className="tnum text-ink px-3 py-2 text-right font-semibold">
                            {formatPoints(s.best)}
                            <span className="text-ink-4 font-normal">
                              {t('onlineExamsCopy.m263')}
                              {formatPoints(s.max)}
                            </span>
                          </td>
                          <td className="tnum text-ink-2 px-3 py-2 text-right">{s.attempts}</td>
                          <td className="tnum text-ink-2 hidden px-3 py-2 text-right sm:table-cell">
                            {mmss(s.seconds)}
                          </td>
                          <td className="tnum text-ink-3 hidden px-3 py-2 text-right sm:table-cell">
                            {new Date(s.lastAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </>
            )}
          </div>
        )}
      </PageShell>
    )
  }
  return null
}
