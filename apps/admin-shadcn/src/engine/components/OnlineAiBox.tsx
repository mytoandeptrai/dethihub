import { ArrowUp, FileText, Plus, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AiQuestionPreview } from '@/components/ai-question-preview'
import { dialog } from '@/engine/components/Dialog'
import { MathText } from '@/engine/components/MathText'
import { Button } from '@/engine/components/ui'
import { readImportFile } from '@/engine/lib/importFile'
import { reportQuota, TOKENS_PER_POINT } from '@/engine/lib/llm'
import {
  attachmentsPrompt,
  parseAiReply,
  sanitizeAiQuestions,
  type AiAttachment,
} from '@/engine/lib/onlineAi'
import { useAiQuestionStream, type AiQuestionRequest } from '@/hooks/use-ai-question-stream'

import type { Question } from '@/engine/data/types'
import type { OnlineMeta } from '@/engine/lib/onlineExam'
import type { GeneratedQuestion } from '@/lib/ai-question-stream'

const ACCEPT = '.docx,.pdf,.txt,.md'
const MAX_FILES = 5

export function OnlineAiBox({
  meta,
  questions,
  onAdd,
}: {
  meta: OnlineMeta
  questions: Question[]
  onAdd: (qs: Question[]) => void
}) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<AiAttachment[]>([])
  const [reading, setReading] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [inserted, setInserted] = useState(false)
  const [version, setVersion] = useState(0)
  const generation = useAiQuestionStream()
  const abort = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // lời gọi AI chạy lâu: dùng onAdd mới nhất khi xong, không phải bản lúc bấm gửi
  const latest = useRef(onAdd)
  latest.current = onAdd

  useEffect(() => () => abort.current?.abort(), [])

  const attach = async (picked: File[]) => {
    if (!picked.length) return
    if (files.length + picked.length > MAX_FILES)
      return void dialog.alert(`Đính kèm tối đa ${MAX_FILES} file mỗi lần.`, {
        title: 'Quá nhiều file',
      })
    setReading(true)
    const added: AiAttachment[] = []
    for (const f of picked) {
      try {
        const data = await readImportFile(f)
        added.push({ name: f.name, text: data.text })
      } catch (err) {
        await dialog.alert(err instanceof Error ? err.message : 'Không đọc được file này.', {
          title: `Không đọc được "${f.name}"`,
        })
      }
    }
    setFiles((list) => [...list, ...added])
    setReading(false)
  }

  const generate = async (request?: AiQuestionRequest) => {
    if (busy || abort.current) return
    setBusy(true)
    setMessage('')
    setInserted(false)
    setVersion((current) => current + 1)
    const ctrl = new AbortController()
    abort.current = ctrl
    ctrl.signal.addEventListener('abort', generation.stop, { once: true })
    try {
      const res = await (request
        ? generation.run(request, { signal: ctrl.signal, onQuota: reportQuota })
        : generation.retry())
      const { message, questions: qs } = parseAiReply(res.content)
      if (!res.stopped && !qs.length)
        setMessage(message || 'Bạn nói rõ số câu, dạng câu và nội dung giúp mình nhé.')
    } catch (err) {
      if (!ctrl.signal.aborted)
        setMessage(err instanceof Error ? err.message : 'Không gọi được AI, thử lại sau.')
    } finally {
      ctrl.signal.removeEventListener('abort', generation.stop)
      abort.current = null
      setBusy(false)
    }
  }

  const send = async () => {
    const text = input.trim()
    if ((!text && !files.length) || busy || reading) return
    const request: AiQuestionRequest = {
      body: {
        task: 'de-online',
        stream: true,
        reasoningEffort: 'medium',
        maxTokens: 12000,
        messages: [
          {
            role: 'user',
            content:
              (text || 'Dựa vào tài liệu đính kèm, soạn các câu hỏi phù hợp cho đề này.') +
              attachmentsPrompt(files),
          },
        ],
        taskInput: {
          meta: { title: meta.title, subject: meta.subject, grade: meta.grade },
          questions: questions.map((q) => ({ number: q.number, type: q.type, prompt: q.prompt })),
        } as unknown as AiQuestionRequest['body']['taskInput'],
      },
      total: Number(text.match(/(\d+)\s*câu/i)?.[1]) || undefined,
    }
    setInput('')
    setFiles([])
    await generate(request)
  }

  const addQuestions = (selected: GeneratedQuestion[]) => {
    const qs = sanitizeAiQuestions(selected.map((question) => question.raw))
    if (!qs.length) return setMessage('Bạn nói rõ số câu, dạng câu và nội dung giúp mình nhé.')
    latest.current(qs)
    setInserted(true)
  }

  const canSend = (input.trim() !== '' || files.length > 0) && !reading

  return (
    <section
      aria-label="Soạn câu hỏi cùng AI"
      className="bg-surface mb-5 rounded-[8px] p-4 shadow-[0_1px_2px_rgba(60,48,32,0.03)]"
    >
      <form
        className="flex items-end gap-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        {/* "Trợ lý giấy" của app: bản tĩnh lúc nghỉ, bản động lúc AI đang soạn (giảm chuyển động thì giữ bản tĩnh) */}
        <span className="relative mb-0.5 size-10 shrink-0" aria-hidden="true">
          <img
            src="/brand/ai-static.svg"
            alt=""
            width={40}
            height={40}
            className={`size-10 ${busy ? 'motion-safe:hidden' : ''}`}
          />
          {busy ? (
            <img
              src="/brand/ai-static.svg"
              alt=""
              width={40}
              height={40}
              className="absolute inset-0 size-10 motion-safe:animate-pulse motion-reduce:hidden"
            />
          ) : null}
        </span>

        <div
          className={`border-line-2 focus-within:border-clay focus-within:ring-clay/15 hover:border-ink-4 flex min-h-[44px] min-w-0 flex-1 items-end gap-1.5 rounded-[6px] border bg-white pl-1.5 transition-all duration-200 focus-within:ring-2 ${busy ? 'bg-sunken/60' : ''}`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const picked = [...(e.target.files ?? [])]
              e.target.value = ''
              void attach(picked)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy || reading}
            aria-label="Thêm tệp nguồn"
            data-tip="Thêm tệp Word, PDF hoặc văn bản"
            className="text-ink-3 hover:bg-sunken hover:text-ink mb-[5px] flex size-8 shrink-0 items-center justify-center rounded-[5px] transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            {reading ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="size-4" />
            )}
          </button>

          {files.length > 0 ? (
            <span className="bg-clay-tint text-clay-deep mb-[7px] inline-flex shrink-0 items-center rounded-full text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={() => setListOpen(true)}
                data-tip={files.map((f) => f.name).join('\n')}
                aria-label={`Xem ${files.length} file đính kèm`}
                className="hover:bg-clay/10 inline-flex items-center gap-1 rounded-l-full py-1 pr-1 pl-2.5 transition-colors"
              >
                <span className="tnum">{files.length}</span>
                <span className="hidden sm:inline">tệp đính kèm</span>
                <span className="sm:hidden">tệp</span>
              </button>
              <button
                type="button"
                onClick={() => setFiles([])}
                disabled={busy}
                aria-label="Gỡ các tệp đã chọn"
                className="hover:bg-clay/15 mr-1 flex size-5 items-center justify-center rounded-full transition-colors disabled:pointer-events-none"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <textarea
            rows={1}
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void send()
              }
            }}
            aria-label="Nội dung cần AI soạn"
            aria-busy={busy}
            placeholder={
              busy
                ? 'AI đang soạn câu hỏi…'
                : files.length
                  ? 'Soạn câu hỏi dựa trên tệp…'
                  : 'Chủ đề, số câu và dạng câu cần soạn…'
            }
            className="text-ink placeholder:text-ink-4 max-h-[120px] min-h-[42px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[14px] leading-relaxed [overflow-wrap:anywhere] focus:outline-none"
          />
        </div>

        {busy ? (
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            aria-label="Dừng"
            data-tip="Dừng"
            className="bg-sunken text-ink-2 hover:text-ink flex size-11 shrink-0 items-center justify-center rounded-[6px] transition-colors"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Gửi"
            data-tip="Gửi"
            data-tip-kbd="Enter"
            className="bg-clay hover:bg-clay-deep flex size-11 shrink-0 items-center justify-center rounded-[6px] text-white transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>

      {generation.state.questions.length > 0 || (busy && generation.state.total) ? (
        <AiQuestionPreview
          key={version}
          questions={generation.state.questions}
          total={generation.state.total}
          busy={busy}
          inserted={inserted}
          refundedTokens={generation.state.refundedTokens}
          onInsert={addQuestions}
          onRegenerate={() => void generate()}
          renderText={(text) => <MathText as="span">{text}</MathText>}
        />
      ) : busy ? (
        <p role="status" className="text-ink-3 mt-3 text-sm">
          AI đang soạn câu hỏi…
        </p>
      ) : null}
      {message ? (
        <p role="alert" className="text-clay-deep mt-3 text-sm">
          {message}
        </p>
      ) : null}
      {generation.state.error && !busy ? (
        <button
          type="button"
          className="text-clay-deep mt-2 text-sm font-semibold"
          onClick={() => void generate()}
        >
          Thử lại
        </button>
      ) : null}
      {!generation.state.questions.length && generation.state.refundedTokens ? (
        <p className="text-sage mt-2 text-sm">
          Đã hoàn {(generation.state.refundedTokens / TOKENS_PER_POINT).toLocaleString('vi-VN')}{' '}
          điểm
        </p>
      ) : null}

      {listOpen && files.length > 0 ? (
        <AttachmentsModal
          files={files}
          reading={reading}
          onAdd={() => fileRef.current?.click()}
          onRemove={(i) => {
            const next = files.filter((_, j) => j !== i)
            setFiles(next)
            if (!next.length) setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      ) : null}
    </section>
  )
}

const kchars = (n: number) =>
  n >= 1000 ? `${Math.round(n / 100) / 10} nghìn ký tự`.replace('.', ',') : `${n} ký tự`

/** Danh sách file đính kèm: bỏ từng file, thêm file; Esc hoặc bấm ra ngoài để đóng. */
function AttachmentsModal({
  files,
  reading,
  onAdd,
  onRemove,
  onClose,
}: {
  files: AiAttachment[]
  reading: boolean
  onAdd: () => void
  onRemove: (i: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-5 py-8 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tệp nguồn cho AI"
        className="anim-pop bg-surface shadow-float my-auto w-full max-w-[460px] rounded-[8px] p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-ink text-[20px] leading-snug font-semibold">
              Tệp nguồn cho AI
            </h2>
            <p className="text-ink-3 mt-1 text-[13px]" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="bg-sunken text-ink-3 hover:text-ink flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <ul className="divide-line border-line mt-5 max-h-[320px] divide-y overflow-y-auto rounded-[6px] border">
          {files.map((f, i) => (
            <li key={f.name + i} className="flex items-center gap-3 px-3.5 py-2.5">
              <FileText className="text-ink-3 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[14px] font-medium" data-tip={f.name}>
                  {f.name}
                </p>
                <p className="tnum text-ink-3 text-[12px]">{kchars(f.text.length)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Bỏ ${f.name}`}
                data-tip="Gỡ tệp này"
                className="text-ink-3 hover:bg-clay-soft hover:text-clay flex size-8 shrink-0 items-center justify-center rounded-[6px] transition-colors"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            variant="soft"
            onClick={onAdd}
            disabled={reading || files.length >= MAX_FILES}
            data-tip={files.length >= MAX_FILES ? `Tối đa ${MAX_FILES} file` : undefined}
          >
            <Plus className="size-4" />
            Thêm tệp
          </Button>
          <Button variant="primary" onClick={onClose}>
            Xong
          </Button>
        </div>
      </div>
    </div>
  )
}
