'use client'
import {
  lib_documents_DOC_TYPES as DOC_TYPES,
  Link,
  lib_documents_MAX_DOC_MB as MAX_DOC_MB,
  components_appIcons_TrashIcon as TrashIcon,
} from '@library-engine'
import { cn } from '@workspace/ui/lib/utils'
import { Clock, ExternalLink, FileText, Search, Upload } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  inputClass,
  PageHeader,
  PageShell,
  SiteSelect,
  SkeletonCard,
  Toolbar,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { LibraryModel } from '@/modules/library/hooks'

import type {
  LibraryParts as Imported0,
  LibraryParts as Imported1,
  LibraryParts as Imported2,
  LibraryParts as Imported3,
  LibraryParts as Imported4,
} from '@/modules/library/containers/library-container/library-container'
const {
  SAMPLE_DOCS,
  TYPE_OPTIONS,
  SUBJECT_FILTER_OPTIONS,
  SUBJECT_UPLOAD_OPTIONS,
  formatSize,
  formatDate,
} = LibraryModel
export function LibraryUi(
  props: ReturnType<typeof LibraryModel.useLibraryContainer> & {
    parts: typeof Imported0
  },
) {
  const { SignInPrompt, Documents, DocGrid } = props.parts
  if (props.viewState === 0) {
    const { session } = props
    return (
      <PageShell>
        <PageHeader title={t('libraryCopy.m451')} description="" />

        {session ? (
          <Documents />
        ) : (
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-24">
              <SignInPrompt />
            </div>
            <div className="min-w-0 [&_ul]:lg:grid-cols-2">
              <DocGrid items={SAMPLE_DOCS} sample />
            </div>
          </div>
        )}
      </PageShell>
    )
  }
  return null
}
export function LibrarySignInPromptUi(
  props: ReturnType<typeof LibraryModel.useSignInPromptContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    return (
      <EmptyState
        title={t('libraryCopy.m452')}
        description=""
        action={
          <Link to={appPaths.auth.login.href}>
            <Button variant="primary">{t('libraryCopy.m107')}</Button>
          </Link>
        }
      />
    )
  }
  return null
}
export function LibraryDocumentsUi(
  props: ReturnType<typeof LibraryModel.useDocumentsContainer> & {
    parts: typeof Imported2
  },
) {
  const { DocGrid } = props.parts
  if (props.viewState === 0) {
    const {
      uploadSubject,
      setUploadSubject,
      busy,
      fileRef,
      setDragging,
      onDrop,
      dragging,
      onPick,
      error,
      docs,
      hasReal,
      remove,
    } = props
    return (
      <div>
        <div className="mb-3 flex justify-end">
          <SiteSelect
            value={uploadSubject}
            options={SUBJECT_UPLOAD_OPTIONS}
            onChange={setUploadSubject}
            label={t('libraryCopy.m453')}
            className="w-[180px]"
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && fileRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !busy) fileRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragging
              ? 'border-clay bg-clay-tint/50'
              : 'border-line-2 bg-surface hover:border-ink-4',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          <span className="bg-sunken text-ink-2 flex size-11 items-center justify-center rounded-full">
            <Upload className="size-5" />
          </span>
          <p className="text-ink text-[15px] font-semibold">
            {busy ? t('libraryCopy.m454') : t('libraryCopy.m455')}
          </p>
          <p className="text-ink-3 text-[13px]">
            {t('libraryCopy.m456')}
            {MAX_DOC_MB}
            {t('libraryCopy.m457')}
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={Object.keys(DOC_TYPES).join(',')}
            className="sr-only"
            onChange={onPick}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {error ? (
          <p role="alert" className="text-clay-deep mt-4 text-[13.5px] font-medium">
            {error}
          </p>
        ) : null}

        <div className="mt-10">
          {docs === null ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} variant="doc" />
              ))}
            </div>
          ) : (
            <DocGrid
              items={hasReal ? (docs ?? []) : SAMPLE_DOCS}
              sample={!hasReal}
              onDelete={remove}
            />
          )}
        </div>
      </div>
    )
  }
  return null
}
export function LibraryDocGridUi(
  props: ReturnType<typeof LibraryModel.useDocGridContainer> & {
    parts: typeof Imported3
  },
) {
  const { DocumentCard } = props.parts
  if (props.viewState === 0) {
    const { shown, sample, q, setQ, subject, setSubject, mime, setMime, filtered, onDelete } = props
    return (
      <div>
        <Toolbar className="justify-between">
          <p className="text-ink-3 text-[13px]">
            <span className="tnum text-ink font-bold">{shown.length}</span>
            {t('libraryCopy.m458')}
            {sample ? (
              <span className="text-honey ml-2 font-semibold">{t('libraryCopy.m459')}</span>
            ) : null}
          </p>
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <div className="relative min-w-[200px] flex-1 sm:w-[260px] sm:flex-none">
              <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('libraryCopy.m460')}
                className={inputClass + ' h-11 pl-11'}
              />
            </div>
            <SiteSelect
              value={subject}
              options={SUBJECT_FILTER_OPTIONS}
              onChange={setSubject}
              label={t('libraryCopy.m413')}
              className="w-[150px]"
            />
            <SiteSelect
              value={mime}
              options={TYPE_OPTIONS}
              onChange={setMime}
              label={t('libraryCopy.m461')}
              className="w-[130px]"
            />
          </div>
        </Toolbar>

        {shown.length === 0 ? (
          <EmptyState
            title={filtered ? t('libraryCopy.m462') : t('libraryCopy.m463')}
            description={filtered ? undefined : t('libraryCopy.m464')}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} sample={sample} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </div>
    )
  }
  return null
}
export function LibraryDocumentCardUi(
  props: ReturnType<typeof LibraryModel.useDocumentCardContainer> & {
    parts: typeof Imported4
  },
) {
  if (props.viewState === 0) {
    const { sample, doc, kind, onDelete, open } = props
    return (
      <Card
        asChild
        className="hover:shadow-lift flex min-w-0 flex-col rounded-xl p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <li>
          <div className="flex items-start justify-between gap-3">
            <span className="bg-clay-tint text-clay flex size-10 shrink-0 items-center justify-center rounded-[8px]">
              <FileText className="size-5" />
            </span>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {sample ? <Badge tone="honey">{t('libraryCopy.m465')}</Badge> : null}
              {doc.subject ? <Badge tone="neutral">{doc.subject}</Badge> : null}
              <Badge tone={kind === 'PDF' ? 'honey' : 'clay'}>{kind}</Badge>
            </div>
          </div>

          <p
            data-tip={doc.name}
            className="font-display text-ink mt-4 line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em]"
          >
            {doc.name}
          </p>
          <p className="text-ink-3 tnum mt-2 flex items-center gap-1.5 text-[12px] font-medium">
            <Clock className="size-3.5" />
            {formatDate(doc.created_at)}
            {t('libraryCopy.m130')}
            {formatSize(doc.size)}
          </p>

          <div className="mt-auto flex items-center gap-2 pt-5">
            {sample ? (
              <span className="bg-sunken text-ink-4 inline-flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-[6px] text-[13px] font-semibold">
                <ExternalLink className="size-3.5" />
                {t('libraryCopy.m5')}
              </span>
            ) : (
              <button
                type="button"
                onClick={open}
                className="bg-sunken text-ink hover:bg-veil inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[6px] text-[13px] font-semibold transition-colors"
              >
                <ExternalLink className="size-3.5" />
                {t('libraryCopy.m5')}
              </button>
            )}
            {sample || !onDelete ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(doc)}
                aria-label={t('libraryCopy.m467', { value0: doc.name })}
              >
                <TrashIcon className="size-4" />
              </Button>
            )}
          </div>
        </li>
      </Card>
    )
  }
  return null
}
