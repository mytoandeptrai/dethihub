/**
 * Client gọi LLM qua proxy nội bộ (/api/llm).
 * Key nằm ở server, không bao giờ xuất hiện trong bundle.
 */
import { streamChat } from '@/apis/ai/requests'
import { ApiClientError } from '@/lib/api-error'
import type { components } from '@workspace/api-types'
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmResult {
  content: string
  reasoning: string
  usage: unknown
  /** chỉ có khi chạy máy dev (script đo); server không gửi tên model cho trình duyệt */
  model?: string
  /** biên nhận để xin hoàn token nếu kết quả không dùng được (gửi lại qua `retryOf`) */
  receipt?: string
  /** lượt `webSearch`: các trang web model đã dẫn */
  citations?: Array<{ url: string; title: string }>
}

export interface LlmOptions {
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
  temperature?: number
  signal?: AbortSignal
  /** biên nhận của lượt trước bị hỏng: server hoàn token lượt đó rồi mới tính lượt này */
  retryOf?: string
  /** tìm trên web trước khi trả lời (DeepSeek chính hãng), kết quả có `citations` */
  webSearch?: boolean
  /** lượt trước không dùng được: server thử model mạnh hơn trước (tốn điểm hơn) */
  strong?: boolean
  /** có thì gọi dạng stream: báo tiến độ thật trong lúc model suy luận / viết */
  onProgress?: (p: LlmProgress) => void
  /** tác vụ do server ghép system prompt (messages không cần role system): tên + dữ liệu người dùng của tác vụ */
  task?: { name: string; input?: unknown }
}

export interface LlmProgress {
  /** `think`: đang suy luận, chưa ra chữ; `write`: đang viết câu trả lời; `retry`: model lỗi, đang gọi lại / đổi model */
  phase: 'think' | 'write' | 'retry'
  /** số ký tự suy luận đã nhận (lượt hiện tại) */
  thought: number
  /** phần suy luận đã nhận (lượt hiện tại) — để hiện dòng "đang nghĩ" chạy theo */
  thinking: string
  /** phần câu trả lời đã nhận (lượt hiện tại) */
  text: string
}


/** Hạn mức AI server báo về (token; giao diện quy ra điểm). */
export interface AiQuota {
  used: number
  limit: number
  scope: 'month'
}
/** 1 điểm AI = 1.000 token (khớp TOKENS_PER_POINT ở server/aiQuota.ts) */
export const TOKENS_PER_POINT = 1000
export const aiPointsLeft = (q: AiQuota) => Math.max(0, Math.floor((q.limit - q.used) / TOKENS_PER_POINT))
/** Lần báo gần nhất + sự kiện `ai-quota` để giao diện cập nhật. */
export let lastAiQuota: AiQuota | null = null
export function reportQuota(q: unknown) {
  if (!q || typeof q !== 'object' || typeof (q as AiQuota).limit !== 'number') return
  lastAiQuota = q as AiQuota
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<AiQuota>('ai-quota', { detail: lastAiQuota }))
}

/** Không đủ điểm AI cho yêu cầu (server trả 429 kèm code "quota"): giao diện mời nạp điểm. */
export class AiQuotaError extends Error {}

export async function callLlm(messages: LlmMessage[], opts: LlmOptions = {}): Promise<LlmResult> {
  return callOnce(messages, opts)
}

/**
 * Gọi rồi kiểm kết quả; không dùng được thì hoàn token lượt đó và gọi lại đúng một lần
 * (lượt gọi lại vẫn hỏng thì trả về để caller tự xử lý).
 */
export async function callLlmChecked(
  messages: LlmMessage[],
  opts: LlmOptions,
  usable: (content: string) => boolean,
): Promise<LlmResult> {
  const first = await callLlm(messages, opts)
  if (usable(first.content)) return first
  return callLlm(messages, { ...opts, retryOf: first.receipt })
}

async function callOnce(messages: LlmMessage[], opts: LlmOptions): Promise<LlmResult> {
  if (!opts.task) throw new Error('Tác vụ AI không hợp lệ.')
  const body: components['schemas']['ChatRequestDto'] = {
    task: opts.task.name,
    taskInput: opts.task.input as components['schemas']['ChatRequestDto']['taskInput'],
    messages,
    maxTokens: opts.maxTokens ?? 32000,
    reasoningEffort: opts.reasoningEffort ?? 'max',
    temperature: opts.temperature,
    webSearch: opts.webSearch,
    strong: opts.strong,
  }
  let text = ''
  let thinking = ''
  let final: (LlmResult & { quota?: unknown }) | undefined
  try {
    for await (const event of streamChat(body, opts.signal, opts.retryOf)) {
      const value = JSON.parse(event.data) as Partial<LlmResult> & { type?: string; c?: string; d?: string; error?: string; detail?: string; status?: number; quota?: unknown }
      if (value.type === 'delta') {
        text += value.c ?? ''
        opts.onProgress?.({ phase: 'write', thought: thinking.length, thinking, text })
      } else if (value.type === 'think') {
        thinking += value.d ?? ''
        opts.onProgress?.({ phase: text ? 'write' : 'think', thought: thinking.length, thinking, text })
      } else if (value.type === 'retry') {
        text = ''; thinking = ''
        opts.onProgress?.({ phase: 'retry', thought: 0, thinking, text })
      } else if (value.type === 'done') final = value as LlmResult & { quota?: unknown }
      else if (value.type === 'error') {
        reportQuota(value.quota)
        throw new Error(value.detail ?? value.error ?? 'AI lỗi')
      }
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 429 && /quota/i.test(error.code ?? '')) throw new AiQuotaError(error.message)
    throw error
  }
  if (!final) throw new Error('Kết nối tới AI bị ngắt giữa chừng')
  reportQuota(final.quota)
  if (!final.content?.trim()) throw new Error('AI không trả về nội dung (có thể do suy luận quá dài bị cắt). Hãy thử lại hoặc rút gọn yêu cầu.')
  return final
}

/**
 * Bóc JSON khỏi output của model. Model có thể bọc trong ```json ... ```.
 */
export function extractJson<T>(raw: string): T {
  let text = raw.trim()
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) text = fence[1].trim()
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  const sliced = first >= 0 && last > first ? text.slice(first, last + 1) : text
  const fromFirst = first >= 0 ? text.slice(first) : text
  for (const attempt of [text, sliced, repairJson(sliced), repairJson(fromFirst)]) {
    try {
      return JSON.parse(attempt) as T
    } catch {
      /* thử cách tiếp theo */
    }
  }
  throw new Error('Không phân tích được JSON từ phản hồi của AI')
}

/**
 * Sửa lỗi JSON hay gặp của model: dấu `"` trong chuỗi quên escape (vd
 * `"kích thước AB \"?""`), xuống dòng thô trong chuỗi, dấu phẩy thừa, và
 * JSON bị cắt cụt (đóng nốt chuỗi / ngoặc đang mở).
 */
export function repairJson(src: string): string {
  let out = ''
  let inStr = false
  const stack: string[] = []
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (c === '\\') {
        out += c + (src[i + 1] ?? '')
        i++
      } else if (c === '"') {
        // Chỉ coi là đóng chuỗi nếu sau nó (bỏ khoảng trắng) là ký tự cấu trúc.
        let j = i + 1
        while (j < src.length && /\s/.test(src[j])) j++
        const next = src[j]
        if (next === undefined || next === ',' || next === ':' || next === '}' || next === ']') {
          inStr = false
          out += c
        } else out += '\\"'
      } else if (c === '\n') out += '\\n'
      else if (c === '\r') out += ''
      else if (c === '\t') out += '\\t'
      else out += c
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') stack.pop()
    out += c
  }
  if (inStr) out += '"'
  out = out.replace(/,\s*$/, '')
  while (stack.length) out += stack.pop()
  return out.replace(/,(\s*[}\]])/g, '$1')
}
