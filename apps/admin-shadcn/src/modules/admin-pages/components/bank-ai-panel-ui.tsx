'use client'
import {
  lib_bankImport_IMPORT_FILE_ACCEPT as IMPORT_FILE_ACCEPT,
  data_types_TYPE_LABEL as TYPE_LABEL,
  components_appIcons_TrashIcon as TrashIcon,
  lib_bankImport_draftReady as draftReady,
  lib_questionImage_pastedImage as pastedImage,
} from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { cn } from '@workspace/ui/lib/utils'
import { FileUp, Pencil, Sparkles } from 'lucide-react'
import Image from 'next/image'

import { MathText } from '@/components/online-exams-kernel'
import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  Spinner,
  inputClass,
} from '@/components/product-ui'
import { t as translate } from '@/i18n/translate-admin-pages'
import { BankAiPanelModel } from '@/modules/admin-pages/hooks'

import type { BankAiPanelParts as Imported0 } from '@/modules/admin-pages/containers/bank-ai-panel-container/bank-ai-panel-container'
const { answerText } = BankAiPanelModel
export function BankAiPanelBankAiPanelUi(
  props: ReturnType<typeof BankAiPanelModel.useBankAiPanelContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const {
      meta,
      request,
      setRequest,
      count,
      setCount,
      generate,
      busy,
      pickFile,
      fileRef,
      json,
      setJson,
      setJsonError,
      jsonError,
      jsonFileRef,
      importJson,
      warning,
      imageFileRef,
      imageDraftId,
      pickImage,
      drafts,
      chosen,
      saveChosen,
      savingIds,
      imageStates,
      setDrafts,
      onEdit,
      clearImageState,
      setDraftImage,
    } = props
    return (
      <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:overflow-hidden">
        <div className="lg:border-line space-y-5 p-5 lg:overflow-y-auto lg:border-r">
          <div className="[&_.grid]:grid-cols-2">{meta}</div>

          <div className="border-line-2 bg-paper space-y-2.5 rounded-[8px] border p-4">
            <label className="text-ink block text-[13px] font-semibold" htmlFor="ai-request">
              {translate('adminPagesCopy.m403')}
            </label>
            <textarea
              id="ai-request"
              rows={3}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={translate('adminPagesCopy.m404')}
              className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
            />
            <div className="flex items-center gap-2">
              <label className="text-ink-2 text-[13px]" htmlFor="ai-count">
                {translate('adminPagesCopy.m208')}
              </label>
              <input
                id="ai-count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className={cn(inputClass, 'h-9 w-20 text-[14px]')}
              />
              <Button
                variant="clay"
                size="sm"
                className="ml-auto"
                onClick={() => void generate()}
                disabled={!!busy}
              >
                <Sparkles className="size-4" />
                <span>{translate('adminPagesCopy.m405')}</span>
              </Button>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (!busy) pickFile(e.dataTransfer.files[0])
            }}
            className="border-line-2 rounded-[8px] border border-dashed p-4 text-center"
          >
            <input
              ref={fileRef}
              type="file"
              accept={IMPORT_FILE_ACCEPT}
              hidden
              aria-label={translate('adminPagesCopy.m406')}
              onChange={(e) => {
                pickFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <p className="text-ink text-[13px] font-semibold">{translate('adminPagesCopy.m407')}</p>
            <p className="text-ink-3 mt-1 mb-3 text-[12.5px] leading-relaxed">
              {translate('adminPagesCopy.m408')}
            </p>
            <Button
              variant="soft"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={!!busy}
            >
              <FileUp className="size-4" />
              <span>{translate('adminPagesCopy.m409')}</span>
            </Button>
          </div>

          <Card className="border-line-2 bg-paper space-y-2.5 border p-4">
            <label className="text-ink block text-[13px] font-semibold" htmlFor="bank-json">
              {translate('adminPagesCopy.m410')}
            </label>
            <textarea
              id="bank-json"
              rows={4}
              value={json}
              onChange={(e) => {
                setJson(e.target.value)
                setJsonError(null)
              }}
              aria-invalid={jsonError ? true : undefined}
              aria-describedby={jsonError ? 'bank-json-error' : undefined}
              className={cn(inputClass, 'h-auto py-2.5 font-mono text-[13px]')}
            />
            {jsonError ? (
              <p id="bank-json-error" role="alert" className="text-clay text-[12px]">
                {jsonError}
              </p>
            ) : null}
            <input
              ref={jsonFileRef}
              type="file"
              accept=".json"
              hidden
              aria-label={translate('adminPagesCopy.m411')}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                if (file.name.toLowerCase().endsWith('.json')) pickFile(file)
                else
                  void dialog.alert(translate('adminPagesCopy.m412'), {
                    title: translate('adminPagesCopy.m25'),
                  })
              }}
            />
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                variant="soft"
                size="sm"
                onClick={() => jsonFileRef.current?.click()}
                disabled={!!busy}
              >
                <FileUp className="size-4" />
                {translate('adminPagesCopy.m411')}
              </Button>
              <Button
                variant="clay"
                size="sm"
                onClick={importJson}
                disabled={!!busy || !json.trim()}
              >
                {translate('adminPagesCopy.m413')}
              </Button>
            </div>
          </Card>

          {busy ? (
            <p className="text-ink-2 flex items-center gap-2 text-[13px] font-medium">
              <Spinner className="size-3.5" />
              {busy}
            </p>
          ) : null}
          {warning ? (
            <p role="status" className="text-honey text-[12.5px] leading-relaxed">
              {warning}
            </p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-col">
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            hidden
            aria-label={translate('adminPagesCopy.m414')}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file && imageDraftId.current) void pickImage(imageDraftId.current, file)
            }}
          />
          <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
            <p className="text-ink text-[13.5px] font-semibold">
              {drafts.length}
              {translate('adminPagesCopy.m415')}
              {chosen.length}
            </p>
            <Button
              variant="clay"
              size="sm"
              onClick={() => void saveChosen()}
              disabled={
                !!savingIds || chosen.length === 0 || chosen.some((d) => imageStates[d.id] === true)
              }
            >
              {savingIds ? <Spinner className="size-3.5" /> : null}
              <span>
                {translate('adminPagesCopy.m416')}
                {chosen.length}
                {translate('adminPagesCopy.m417')}
              </span>
            </Button>
          </div>
          <div className="flex-1 space-y-3 p-5 lg:overflow-y-auto">
            {drafts.length === 0 ? (
              <EmptyState title={translate('adminPagesCopy.m418')} />
            ) : (
              drafts.map((d, i) => {
                const ready = draftReady(d)
                const imageState = imageStates[d.id]
                const imageBusy = imageState === true
                const draftSaving = savingIds?.has(d.id)
                const imageLocked = imageBusy || draftSaving
                return (
                  <article
                    key={d.id}
                    tabIndex={0}
                    aria-label={translate('adminPagesCopy.m419', { value0: String(i + 1) })}
                    onPaste={(e) => {
                      const file = pastedImage(e)
                      if (!file) return
                      e.preventDefault()
                      void pickImage(d.id, file)
                    }}
                    className="border-line rounded-[8px] border p-4"
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={d.selected}
                        disabled={!ready}
                        onChange={(e) =>
                          setDrafts((list) =>
                            list.map((x) =>
                              x.id === d.id ? { ...x, selected: e.target.checked } : x,
                            ),
                          )
                        }
                        aria-label={translate('adminPagesCopy.m420', { value0: String(i + 1) })}
                        className="border-line-2 text-clay size-4 rounded"
                      />
                      <span className="text-ink text-[13px] font-semibold">
                        {translate('adminPagesCopy.m236')}
                        {i + 1}
                      </span>
                      <Badge tone="outline">{TYPE_LABEL[d.type]}</Badge>
                      {ready ? null : (
                        <Badge tone="honey">{translate('adminPagesCopy.m421')}</Badge>
                      )}
                      <div className="text-ink-3 ml-auto flex items-center">
                        <button
                          type="button"
                          disabled={imageLocked}
                          onClick={() => onEdit(d)}
                          aria-label={translate('adminPagesCopy.m422', { value0: String(i + 1) })}
                          className="hover:text-ink rounded p-1.5 disabled:opacity-40"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={imageLocked}
                          onClick={() => {
                            clearImageState(d.id)
                            setDrafts((list) => list.filter((x) => x.id !== d.id))
                          }}
                          aria-label={translate('adminPagesCopy.m423', { value0: String(i + 1) })}
                          className="hover:text-clay rounded p-1.5 disabled:opacity-40"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_130px]">
                      <section className="min-w-0">
                        <h4 className="text-ink-4 mb-1 text-[11px] font-semibold tracking-wider uppercase">
                          {translate('adminPagesCopy.m424')}
                        </h4>
                        <MathText as="div" className="text-ink text-[14px] leading-relaxed">
                          {d.prompt}
                        </MathText>
                        {d.options?.length ? (
                          <ul className="text-ink-2 mt-1.5 space-y-0.5 text-[13.5px]">
                            {d.options.map((o) => (
                              <li key={o.key}>
                                <b className="font-semibold">
                                  {o.key}
                                  {translate('adminPagesCopy.m238')}
                                </b>{' '}
                                <MathText as="span">{o.text}</MathText>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                      <section className="min-w-0">
                        <h4 className="text-ink-4 mb-1 text-[11px] font-semibold tracking-wider uppercase">
                          {translate('adminPagesCopy.m425')}
                        </h4>
                        <p
                          className={cn(
                            'text-[14px] font-semibold',
                            d.answer || d.type.startsWith('tu-luan') ? 'text-ink' : 'text-honey',
                          )}
                        >
                          {answerText(d)}
                        </p>
                        {d.explanation ? (
                          <MathText
                            as="div"
                            className="text-ink-3 mt-1 text-[13px] leading-relaxed"
                          >
                            {d.explanation}
                          </MathText>
                        ) : null}
                      </section>
                      <section
                        className="self-start"
                        onDragOver={(e) => {
                          if (e.dataTransfer.types.includes('Files')) e.preventDefault()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const file = e.dataTransfer.files[0]
                          if (file) void pickImage(d.id, file)
                        }}
                      >
                        <h4 className="text-ink-4 mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                          {translate('adminPagesCopy.m426')}
                          {imageBusy ? (
                            <span role="status" aria-label={translate('adminPagesCopy.m427')}>
                              <Spinner className="size-3" />
                            </span>
                          ) : null}
                        </h4>
                        {d.image ? (
                          <Image
                            unoptimized
                            width={0}
                            height={0}
                            src={d.image.src}
                            alt={
                              d.image.alt ||
                              translate('adminPagesCopy.m428', { value0: String(i + 1) })
                            }
                            style={{ height: 'auto' }}
                            className="border-line max-h-32 w-full rounded-[6px] border bg-white object-contain"
                          />
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Button
                            type="button"
                            variant="soft"
                            size="sm"
                            className="h-7 px-2 text-[12px]"
                            disabled={imageLocked}
                            onClick={() => {
                              imageDraftId.current = d.id
                              imageFileRef.current?.click()
                            }}
                          >
                            {d.image ? (
                              <Pencil className="size-3.5" />
                            ) : (
                              <FileUp className="size-3.5" />
                            )}
                            {d.image
                              ? translate('adminPagesCopy.m429')
                              : translate('adminPagesCopy.m430')}
                          </Button>
                          {d.image ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={imageLocked}
                              aria-label={translate('adminPagesCopy.m431')}
                              data-tip={translate('adminPagesCopy.m431')}
                              onClick={() => {
                                setDraftImage(d.id)
                                clearImageState(d.id)
                              }}
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                        {typeof imageState === 'string' ? (
                          <p role="alert" className="text-clay mt-1 text-[12px]">
                            {imageState}
                          </p>
                        ) : null}
                      </section>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }
  return null
}
