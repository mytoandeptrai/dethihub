'use client'
import {
  lib_documents_DOC_TYPES as DOC_TYPES,
  Link,
  Navigate,
  components_appIcons_TrashIcon as TrashIcon,
} from '@profile-engine'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ChevronLeft, Search, Upload, X } from 'lucide-react'

import { LoadingRegion, CardGridSkeleton, PageSkeleton } from '@/components/page-skeleton'
import {
  SiteButton as Button,
  DocIcon,
  EmptyState,
  inputClass,
  PageHeader,
  Pager,
  PageShell,
  ProgressBar,
  Segmented,
  SiteSelect,
  Spinner,
  Toolbar,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { MyUploadsModel } from '@/modules/profile/hooks'

import type {
  MyUploadsParts as Imported0,
  MyUploadsParts as Imported1,
  MyUploadsParts as Imported2,
} from '@/modules/profile/containers/my-uploads-container/my-uploads-container'
const { mb, KIND_LABEL, KIND_PATH, PER_PAGE } = MyUploadsModel
export function MyUploadsMyUploadsUi(
  props: ReturnType<typeof MyUploadsModel.useMyUploadsContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 2) return <PageSkeleton />
  const { MyFilesCard } = props.parts
  if (props.viewState === 0) {
    return <Navigate to={appPaths.auth.login.href} replace />
  }
  if (props.viewState === 1) {
    return (
      <PageShell className="flex flex-col gap-6">
        <Link
          to={appPaths.profile.href}
          className="text-ink-3 hover:text-ink -mb-2 inline-flex w-fit items-center gap-1 text-[13px]"
        >
          <ChevronLeft className="size-4" />
          {t('profileCopy.m59')}
        </Link>
        <MyFilesCard />
      </PageShell>
    )
  }
  return null
}
export function MyUploadsStorageBarUi(
  props: ReturnType<typeof MyUploadsModel.useStorageBarContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const { st, pct, quota } = props
    return (
      <section className="border-line bg-surface mb-6 rounded-xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink-3 text-[13px] font-semibold tracking-wider uppercase">
            {t('profileCopy.m60')}
          </h2>
          {typeof st === 'object' ? (
            <p className="font-display text-ink tnum text-[22px] font-semibold">
              {mb(st.used)}{' '}
              <span className="text-ink-3 text-[14px] font-medium">
                {t('profileCopy.m61')}
                {mb(st.max)}
              </span>
            </p>
          ) : st === 'loading' ? (
            <LoadingRegion>
              <Skeleton className="h-7 w-36" />
            </LoadingRegion>
          ) : (
            <p className="text-ink-3 text-[13px]">{t('profileCopy.m62')}</p>
          )}
        </div>
        <ProgressBar pct={pct} label={t('profileCopy.m63')} className="mt-3" />
        {typeof st === 'object' ? (
          <ul className="text-ink-3 mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
            {KIND_LABEL.map(([k, label]) => {
              const v = st.kinds[k]
              const full = v?.limit !== null && v?.limit !== undefined && v.count >= v.limit
              return (
                <li key={k} className={full ? 'text-clay-deep font-semibold' : ''}>
                  {label}
                  {t('profileCopy.m64')}
                  <span className="tnum">
                    {v?.count ?? 0}
                    {v?.limit === null || v?.limit === undefined ? '' : `/${v.limit}`}
                    {t('profileCopy.m65')}
                    {mb(v?.bytes ?? 0)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {quota ? (
          <p
            role="alert"
            className="bg-clay-tint text-clay-deep mt-3 rounded-[6px] px-3 py-2 text-[13px]"
          >
            {t('profileCopy.m66')}
            {quota}
            {t('profileCopy.m67')}
          </p>
        ) : pct >= 90 ? (
          <p className="text-clay-deep mt-3 text-[12.5px]">{t('profileCopy.m68')}</p>
        ) : null}
      </section>
    )
  }
  return null
}
export function MyUploadsMyFilesCardUi(
  props: ReturnType<typeof MyUploadsModel.useMyFilesCardContainer> & {
    parts: typeof Imported2
  },
) {
  const { StorageBar } = props.parts
  if (props.viewState === 0) {
    const {
      all,
      fileRef,
      onPick,
      err,
      files,
      empty,
      listRef,
      q,
      setQ,
      sort,
      setSort,
      filter,
      setFilter,
      countOf,
      pageItems,
      open,
      onDelete,
      pages,
      cur,
      shown,
      goPage,
    } = props
    return (
      <section className="min-w-0">
        <PageHeader
          title={t('profileCopy.m69')}
          count={
            <>
              {all.length}
              {t('profileCopy.m70')}
            </>
          }
          description=""
          actions={
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              {t('profileCopy.m71')}
            </Button>
          }
        />
        <StorageBar />
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={onPick}
        />
        {err ? (
          <p
            role="alert"
            className="bg-clay-tint text-clay-deep mt-4 rounded-[6px] px-3 py-2 text-[13px]"
          >
            {err}
          </p>
        ) : null}
        {files === 'error' ? (
          <p className="text-ink-3 mt-4 text-[13px]">{t('profileCopy.m72')}</p>
        ) : null}
        {empty && files === 'loading' ? (
          <LoadingRegion className="mt-6">
            <CardGridSkeleton />
          </LoadingRegion>
        ) : empty ? (
          <EmptyState title={t('profileCopy.m73')} description={t('profileCopy.m74')} />
        ) : (
          <div ref={listRef} className="mt-5 scroll-mt-24">
            <Toolbar>
              <label className="relative min-w-[180px] flex-1">
                <Search className="text-ink-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('profileCopy.m75', { value0: String(all.length) })}
                  aria-label={t('profileCopy.m76')}
                  className={`${inputClass} h-11 pl-9 text-[13.5px]`}
                />
              </label>
              <SiteSelect
                value={sort}
                onChange={setSort}
                label={t('profileCopy.m77')}
                className="w-[140px]"
                options={[
                  { value: 'new', label: t('profileCopy.m78') },
                  { value: 'name', label: t('profileCopy.m79') },
                  { value: 'size', label: t('profileCopy.m80') },
                ]}
              />
            </Toolbar>
            <Segmented
              value={filter}
              onChange={setFilter}
              label={t('profileCopy.m81')}
              className="mt-2 overflow-x-auto"
              options={[
                { key: 'all', label: t('profileCopy.m82'), count: all.length },
                { key: 'exam', label: t('profileCopy.m45'), count: countOf('exam') },
                { key: 'slide', label: t('profileCopy.m83'), count: countOf('slide') },
                { key: 'board', label: t('profileCopy.m46'), count: countOf('board') },
                { key: 'file', label: t('profileCopy.m84'), count: countOf('file') },
              ]}
            />
            {pageItems.length === 0 ? (
              <EmptyState title={t('profileCopy.m85')} />
            ) : (
              <ul className="mt-4 space-y-2">
                {pageItems.map((it) => {
                  const failed = typeof it.pending === 'object' ? it.pending.error : null
                  return (
                    <li
                      key={it.id}
                      className={`border-line bg-surface hover:shadow-lift flex min-w-0 items-center gap-3 rounded-xl border px-3 py-4 shadow-sm transition-shadow motion-reduce:transition-none ${it.pending && !failed ? 'opacity-70' : ''}`}
                    >
                      <span className="flex h-8 w-11 shrink-0 items-center justify-center">
                        {it.kind === 'file' ? (
                          <span className="bg-sunken text-ink-2 flex h-8 w-11 items-center justify-center rounded-[5px] text-[11px] font-semibold">
                            {DOC_TYPES[it.mime ?? ''] ?? t('profileCopy.m86')}
                          </span>
                        ) : (
                          <DocIcon kind={it.kind} size={24} />
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => open(it)}
                        disabled={!!it.pending}
                        data-tip={it.title}
                        className="min-w-0 flex-1 text-left disabled:cursor-default"
                      >
                        <span className="text-ink hover:text-clay-deep block truncate text-[14px]">
                          {it.title}
                        </span>
                        <span
                          className={`block truncate text-[12px] ${failed ? 'text-clay-deep' : 'text-ink-3'}`}
                        >
                          {failed ??
                            (it.pending === 'uploading'
                              ? t('profileCopy.m87')
                              : it.pending === 'waiting'
                                ? t('profileCopy.m88')
                                : KIND_PATH[it.kind])}
                        </span>
                      </button>
                      <span className="text-ink-3 tnum hidden shrink-0 text-[12.5px] sm:inline">
                        {new Date(it.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-ink-3 tnum w-16 shrink-0 text-right text-[12.5px]">
                        {mb(it.size)}
                      </span>
                      {it.pending && !failed ? (
                        <span className="grid size-8 shrink-0 place-items-center">
                          <Spinner />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void onDelete(it)}
                          aria-label={
                            failed
                              ? t('profileCopy.m89', { value0: it.title })
                              : t('profileCopy.m90', { value0: it.title })
                          }
                          data-tip={failed ? t('profileCopy.m91') : t('profileCopy.m57')}
                          className="text-ink-3 hover:bg-sunken hover:text-clay-deep grid size-8 shrink-0 place-items-center rounded-[6px]"
                        >
                          {failed ? <X className="size-4" /> : <TrashIcon className="size-4" />}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {pages > 1 ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-ink-3 tnum text-[12.5px]">
                  {(cur - 1) * PER_PAGE + 1}
                  {t('profileCopy.m92')}
                  {Math.min(cur * PER_PAGE, shown.length)}
                  {t('profileCopy.m93')}
                  {shown.length}
                </span>
                <div className="[&>nav]:mt-0">
                  <Pager page={cur} pages={pages} go={goPage} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    )
  }
  return null
}
