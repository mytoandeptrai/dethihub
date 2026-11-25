import type { ChatTurn } from '../examEditor/AiPanel'
import type { AiQuestionRequest } from '@/hooks/use-ai-question-stream'

type HistoryTurn = Pick<ChatTurn, 'id' | 'role' | 'text' | 'intent' | 'sources' | 'webSources' | 'sourceNote' | 'error' | 'refs' | 'fileNames' | 'pickedSources' | 'cost' | 'incomplete' | 'aiRequest'>
const MAX_TURNS = 60

export const chatHistoryKey = (mode: 'exam' | 'slide', id: string) => `derou.ai-chat.${mode}.${id}`

export function encodeChatHistory(turns: ChatTurn[]): string {
  return JSON.stringify(turns
    .filter((turn) => !turn.pending && turn.planState !== 'pending' && turn.askState !== 'open')
    .slice(-MAX_TURNS)
    .map(({ id, role, text, intent, sources, webSources, sourceNote, error, refs, files, fileNames, pickedSources, cost, incomplete, aiRequest, generation }): HistoryTurn => ({
      id, role, text, intent, sources, webSources, sourceNote, error, refs, ...(cost ? { cost } : {}),
      pickedSources: pickedSources?.map(({ name, kind }) => ({ name, kind })),
      fileNames: files?.map((file) => file.name) ?? fileNames,
      ...(incomplete ? { incomplete: true, ...(aiRequest ? { aiRequest: { ...aiRequest, retryOf: generation?.receipt ?? aiRequest.retryOf } } : {}) } : {}),
    })))
}

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const asStrings = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
const asString = (value: unknown) => typeof value === 'string' ? value : undefined

function isRetryRequest(value: unknown): value is AiQuestionRequest {
  if (!isObject(value) || !isObject(value.body)) return false
  const body = value.body
  return typeof body.task === 'string' && Array.isArray(body.messages) && body.messages.every((message: unknown) =>
    isObject(message) && typeof message.role === 'string' && ['system', 'user', 'assistant'].includes(message.role) && typeof message.content === 'string') &&
    (value.retryOf === undefined || typeof value.retryOf === 'string') &&
    (value.total === undefined || typeof value.total === 'number') &&
    (body.taskInput === undefined || isObject(body.taskInput) && !Array.isArray(body.taskInput)) &&
    (body.reasoningEffort === undefined || typeof body.reasoningEffort === 'string' && ['low', 'medium', 'high', 'max'].includes(body.reasoningEffort)) &&
    ['maxTokens', 'temperature'].every((key) => body[key] === undefined || typeof body[key] === 'number') &&
    ['webSearch', 'stream', 'strong'].every((key) => body[key] === undefined || typeof body[key] === 'boolean')
}

export function decodeChatHistory(raw: string): HistoryTurn[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(-MAX_TURNS).flatMap((turn: unknown): HistoryTurn[] => {
      if (!isObject(turn)) return []
      const { id, role, text, intent, webSources, pickedSources } = turn
      if (typeof id !== 'string' || typeof text !== 'string' || (role !== 'user' && role !== 'assistant')) return []
      return [{
        id, role, text,
        ...(turn.incomplete === true ? { incomplete: true, ...(isRetryRequest(turn.aiRequest) ? { aiRequest: turn.aiRequest } : {}) } : {}),
        intent: intent === 'chat' || intent === 'doc' ? intent : undefined,
        sources: asStrings(turn.sources),
        webSources: Array.isArray(webSources)
          ? webSources.flatMap((item: unknown) =>
              isObject(item) && typeof item.url === 'string' && typeof item.title === 'string'
                ? [{ url: item.url, title: item.title }]
                : [])
          : undefined,
        sourceNote: asString(turn.sourceNote),
        error: asString(turn.error),
        refs: asStrings(turn.refs),
        fileNames: asStrings(turn.fileNames),
        ...(Array.isArray(pickedSources) ? {
          pickedSources: pickedSources.flatMap((source: unknown) => {
            if (!isObject(source)) return []
            const { kind, name } = source
            return typeof name === 'string' && (kind === 'mine' || kind === 'community' || kind === 'library')
              ? [{ kind, name }]
              : []
          }),
        } : {}),
        ...(typeof turn.cost === 'number' && turn.cost > 0 ? { cost: turn.cost } : {}),
      }]
    })
  } catch {
    return []
  }
}

export function loadChatHistory(key: string): HistoryTurn[] {
  try {
    return decodeChatHistory(localStorage.getItem(key) ?? '')
  } catch {
    return []
  }
}

export function saveChatHistory(key: string, encoded: string) {
  try {
    localStorage.setItem(key, encoded)
  } catch {
    // Hết chỗ hoặc trình duyệt chặn lưu cục bộ.
  }
}

export function removeChatHistory(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Trình duyệt chặn lưu cục bộ.
  }
}
