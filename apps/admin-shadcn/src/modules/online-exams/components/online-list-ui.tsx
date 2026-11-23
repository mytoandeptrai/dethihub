'use client'

import {
  lib_math_formatPoints as formatPoints,
  Link,
  lib_onlinePublish_shareUrl as shareUrl,
  lib_onlineExam_totalOf as totalOf,
  components_appIcons_TrashIcon as TrashIcon,
} from '@online-exams-engine'
import {
  Clock,
  History,
  MonitorPlay,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
  Upload,
} from 'lucide-react'

import { MathText } from '@/components/online-exams-kernel'
import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  CopyLink,
  EmptyState,
  PageHeader,
  Pager,
  PageShell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toolbar,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

import type { OnlineListParts } from '@/modules/online-exams/containers/online-list-container'
import type { OnlineListModel } from '@/modules/online-exams/hooks'
type Tab = OnlineListModel.Tab
export function OnlineListOnlineListUi(
  props: ReturnType<typeof OnlineListModel.useOnlineListContainer> & {
    parts: typeof OnlineListParts
  },
) {
  const { ItemCard, PublishedPanel } = props.parts
  if (props.viewState === 0) {
    const { items, onCreate, tab, setTab, paged, remove } = props
    return (
      <PageShell>
        <PageHeader
          eyebrow={t('onlineExamsCopy.m76')}
          title={
            <>
              {t('onlineExamsCopy.m77')}
              <Badge tone="clay" className="ml-2 align-middle text-xs">
                {t('onlineExamsCopy.m78')}
              </Badge>
            </>
          }
          count={
            <>
              {items.length}
              {t('onlineExamsCopy.m79')}
            </>
          }
          description=""
          actions={
            <Button variant="primary" onClick={onCreate}>
              <Plus className="size-4" />
              {t('onlineExamsCopy.m80')}
            </Button>
          }
        />

        <div
          role="note"
          className="border-honey/40 bg-honey-soft text-ink-2 mb-8 flex items-start gap-2.5 rounded-[8px] border px-4 py-3 text-[14px] leading-[1.6]"
        >
          <TriangleAlert className="text-honey mt-0.5 size-4 shrink-0" />
          {t('onlineExamsCopy.m81')}
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="min-w-0">
          <Toolbar>
            <div className="max-w-full min-w-0 overflow-x-auto">
              <TabsList aria-label={t('onlineExamsCopy.m82')}>
                <TabsTrigger value="history">
                  <History className="size-4" />
                  {t('onlineExamsCopy.m83')}
                  <span className="tnum text-xs">{items.length}</span>
                </TabsTrigger>
                <TabsTrigger value="published">
                  <Send className="size-4" />
                  {t('onlineExamsCopy.m84')}
                </TabsTrigger>
              </TabsList>
            </div>
          </Toolbar>

          <TabsContent value={tab} className="mt-0">
            {tab === 'published' ? (
              <PublishedPanel />
            ) : items.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-6" strokeWidth={1.6} />}
                title={t('onlineExamsCopy.m85')}
                description={t('onlineExamsCopy.m86')}
                action={
                  <Button variant="clay" onClick={onCreate}>
                    <Plus className="size-4" />
                    {t('onlineExamsCopy.m80')}
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paged.items.map((it, i) => (
                  <ItemCard key={it.id} item={it} index={i} onDelete={() => remove(it.id)} />
                ))}
              </div>
            )}
          </TabsContent>
          <Pager {...paged} />
        </Tabs>
      </PageShell>
    )
  }
  return null
}
export function OnlineListItemCardUi(
  props: ReturnType<typeof OnlineListModel.useItemCardContainer> & {
    parts: typeof OnlineListParts
  },
) {
  if (props.viewState === 0) {
    const {
      index,
      item,
      published,
      exam,
      onEdit,
      onQuiz,
      playable,
      busy,
      publish,
      requestDelete,
      error,
    } = props
    return (
      <Card
        asChild
        className="anim-delay group hover:shadow-lift flex min-w-0 flex-col overflow-hidden rounded-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <article style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}>
          <Link
            to={appPaths.onlineExams.getHref(item.id)}
            className="border-line bg-sunken/50 relative flex min-h-36 flex-col justify-between gap-4 border-b p-5"
          >
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="clay">{item.meta.subject}</Badge>
                {published ? (
                  <Badge tone="sage">
                    {item.publishedListed === false
                      ? t('onlineExamsCopy.m87')
                      : t('onlineExamsCopy.m88')}
                  </Badge>
                ) : item.status === 'done' ? (
                  <Badge tone="honey">{t('onlineExamsCopy.m89')}</Badge>
                ) : (
                  <Badge tone="neutral">{t('onlineExamsCopy.m90')}</Badge>
                )}
              </div>
              <span className="text-ink-3 text-[12px] font-semibold">{item.meta.grade}</span>
            </div>
            <div className="relative">
              <p className="font-display text-ink line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em]">
                {item.meta.title.trim() || t('onlineExamsCopy.m91')}
              </p>
              <p className="text-ink-3 mt-1 truncate text-[12px]">
                {item.meta.school || t('onlineExamsCopy.m92')}
              </p>
            </div>
          </Link>

          <div className="flex flex-1 flex-col p-5">
            <div className="text-ink-3 flex items-center gap-3.5 text-[12px] font-medium">
              <span className="tnum flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                {item.questions.length}
                {t('onlineExamsCopy.m65')}
              </span>
              <span className="tnum flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {item.settings.noTimeLimit
                  ? t('onlineExamsCopy.m93')
                  : `${item.meta.durationMinutes}′`}
              </span>
              <span className="tnum">
                {formatPoints(totalOf(item.questions))}
                {t('onlineExamsCopy.m66')}
              </span>
            </div>

            {exam.sections[0]?.questions[0]?.prompt ? (
              <p className="text-ink-3 mt-3 line-clamp-2 text-[13px] leading-relaxed">
                <MathText as="span" className="inline">
                  {exam.sections[0].questions[0].prompt}
                </MathText>
              </p>
            ) : null}
            <p className="text-ink-4 mt-3 text-[12px]">
              {t('onlineExamsCopy.m94')}
              {new Date(item.updatedAt).toLocaleString('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <Button variant="soft" size="sm" onClick={onEdit}>
                {item.status === 'draft' ? t('onlineExamsCopy.m95') : t('onlineExamsCopy.m96')}
              </Button>
              <Button
                variant="clay"
                size="sm"
                disabled={!playable}
                data-tip={playable ? t('onlineExamsCopy.m97') : t('onlineExamsCopy.m98')}
                onClick={onQuiz}
              >
                <MonitorPlay className="size-3.5" />
                {t('onlineExamsCopy.m99')}
              </Button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {published ? (
                <CopyLink url={shareUrl(item.publishedId!)} className="min-w-0 flex-1" />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1"
                  disabled={busy || item.status !== 'done' || !playable}
                  data-tip={
                    item.status === 'done' ? t('onlineExamsCopy.m101') : t('onlineExamsCopy.m100')
                  }
                  onClick={() => void publish(true)}
                >
                  <Upload className="size-3.5" />
                  {busy ? t('onlineExamsCopy.m102') : t('onlineExamsCopy.m103')}
                </Button>
              )}
              <button
                type="button"
                aria-label={t('onlineExamsCopy.m14')}
                data-tip={t('onlineExamsCopy.m14')}
                onClick={() => void requestDelete()}
                className="text-ink-3 hover:bg-clay-soft hover:text-clay flex size-9 shrink-0 items-center justify-center rounded-[6px] transition-colors"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
            {error ? (
              <p role="alert" className="text-clay-deep mt-2 text-[12.5px] font-medium">
                {error}{' '}
                {error.includes(t('onlineExamsCopy.m106')) ? (
                  <Link to={appPaths.auth.login.href} className="underline">
                    {t('onlineExamsCopy.m107')}
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>
        </article>
      </Card>
    )
  }
  return null
}
