import { buildChonHinhSystem } from '@/modules/ai/infrastructure/prompts/chon-hinh'
import { buildDeOnlineSystem } from '@/modules/ai/infrastructure/prompts/de-online'
import { ASK_ONLY_SYSTEM, buildExamSystem } from '@/modules/ai/infrastructure/prompts/exam'
import {
  WEB_SEARCH_SYSTEM,
  buildBoardSystem,
  buildSlideBatchSystem,
  buildSlideChatSystem,
  buildSlideEditSystem,
  buildSlidePageSystem,
} from '@/modules/ai/infrastructure/prompts/generated'
import { buildMaTranSystem } from '@/modules/ai/infrastructure/prompts/ma-tran'
import { buildNganHangSystem } from '@/modules/ai/infrastructure/prompts/ngan-hang'
import { buildSuaCauSystem } from '@/modules/ai/infrastructure/prompts/sua-cau'
import { buildSuaSlideSystem } from '@/modules/ai/infrastructure/prompts/sua-slide'
import { buildVeDoThiSystem } from '@/modules/ai/infrastructure/prompts/ve-do-thi'

import type { DeOnlineQuestionSummary } from '@/modules/ai/infrastructure/prompts/de-online'
import type { ExamTaskInput } from '@/modules/ai/infrastructure/prompts/exam'
import type { DeckPlan } from '@/modules/ai/infrastructure/prompts/generated'
import type { PromptSource } from '@/modules/ai/infrastructure/prompts/sources'

const MAX_FIELD = 600_000
const MAX_SOURCES = 40

const str = (v: unknown, max = MAX_FIELD): string | undefined =>
  typeof v === 'string' ? v.slice(0, max) : undefined

function sources(v: unknown): PromptSource[] {
  if (!Array.isArray(v)) return []
  const out: PromptSource[] = []
  for (const s of v.slice(0, MAX_SOURCES)) {
    const o = (s ?? {}) as Record<string, unknown>
    const text = str(o.text)
    if (typeof o.name !== 'string' || text === undefined) continue
    out.push({
      tier: Number(o.tier) === 1 ? 1 : 0,
      name: o.name.slice(0, 300),
      url: str(o.url, 1000),
      text,
    })
  }
  return out
}

function sourceFields(o: Record<string, unknown>) {
  return {
    withSources: o.withSources === true,
    sourceTier: Number(o.sourceTier) === 1 ? 1 : 0,
    sources: sources(o.sources),
    khung: str(o.khung),
  }
}

const strs = (v: unknown, n: number, max: number): string[] | undefined =>
  Array.isArray(v)
    ? v
        .slice(0, n)
        .filter((x): x is string => typeof x === 'string')
        .map((x) => x.slice(0, max))
    : undefined

function planOf(v: unknown): DeckPlan | null {
  const o = (v ?? {}) as Record<string, unknown>
  if (!Array.isArray(o.slides) || o.slides.length === 0) return null
  const slides = o.slides.slice(0, 40).map((s) => {
    const x = (s ?? {}) as Record<string, unknown>
    return {
      title: str(x.title, 300) ?? '',
      layout: str(x.layout, 40) ?? 'bullets',
      tone: str(x.tone, 20),
      kicker: str(x.kicker, 200),
      brief: str(x.brief, 1000),
    }
  })
  return {
    title: str(o.title, 300),
    theme: str(o.theme, 40),
    stylePack: str(o.stylePack, 40),
    decorKit: str(o.decorKit, 40),
    subject: str(o.subject, 40),
    audience: str(o.audience, 300),
    style: str(o.style, 1000),
    mainIdeas: strs(o.mainIdeas, 20, 500),
    slides,
  }
}

function soanDe(raw: unknown): string | null {
  const o = (raw ?? {}) as Record<string, unknown>
  const text = str(o.text)
  if (text === undefined) return null
  const input: ExamTaskInput = {
    text,
    intent: o.intent === 'chat' ? 'chat' : undefined,
    digest: str(o.digest),
    contextSummary: str(o.contextSummary),
    ask: o.ask === true,
    withSources: o.withSources === true,
    sourceTier: Number(o.sourceTier) === 1 ? 1 : 0,
    sources: sources(o.sources),
    khung: str(o.khung),
    webFound: str(o.webFound),
    think: o.think === true,
  }
  return buildExamSystem(input)
}

const hoiTruoc = (): string => ASK_ONLY_SYSTEM

type SlideTaskInput = Record<string, unknown> & { pro?: boolean }

function slideInput(raw: unknown): SlideTaskInput {
  const { pro, ...input } = (raw ?? {}) as Record<string, unknown>
  return { ...input, pro: pro === true }
}

function slideChat(raw: unknown): string | null {
  const o = slideInput(raw)
  if (o.variant !== 'plan' && o.variant !== 'chat' && o.variant !== 'html') return null
  return buildSlideChatSystem({
    variant: o.variant,
    pro: o.pro === true,
    think: o.think === true,
    ask: o.ask === true,
    contextSummary: str(o.contextSummary),
    webFound: str(o.webFound),
    ...sourceFields(o),
  })
}

function bangVe(raw: unknown): string {
  const o = (raw ?? {}) as Record<string, unknown>
  return buildBoardSystem({
    ops: o.ops === true,
    contextSummary: str(o.contextSummary),
    think: o.think === true,
    ...sourceFields(o),
  })
}

function slideLo(raw: unknown): string | null {
  const o = slideInput(raw)
  const plan = planOf(o.plan)
  const idx = Array.isArray(o.indices) ? o.indices.slice(0, 40).map(Number) : []
  if (
    !plan ||
    idx.length === 0 ||
    idx.some((i) => !Number.isInteger(i) || i < 0 || i >= plan.slides.length)
  )
    return null
  return buildSlideBatchSystem(plan, idx, o.think === true, o.pro === true)
}

function slideTrang(raw: unknown): string | null {
  const o = slideInput(raw)
  const plan = planOf(o.plan)
  const i = Number(o.index)
  if (!plan || !Number.isInteger(i) || i < 0 || i >= plan.slides.length) return null
  return buildSlidePageSystem(plan, i, o.pro === true)
}

function slideSua(raw: unknown): string | null {
  const context = str(((raw ?? {}) as Record<string, unknown>).context)
  return context === undefined ? null : buildSlideEditSystem(context)
}

function deOnline(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!o.meta || typeof o.meta !== 'object' || Array.isArray(o.meta)) return null
  const m = o.meta as Record<string, unknown>
  const subject = str(m.subject, 100)
  const grade = str(m.grade, 100)
  if (subject === undefined || grade === undefined) return null
  if (!Array.isArray(o.questions)) return null
  const questions: DeOnlineQuestionSummary[] = o.questions.slice(0, 500).map((item, i) => {
    const q = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      number: typeof q.number === 'number' && Number.isFinite(q.number) ? q.number : i + 1,
      type: str(q.type, 50) ?? 'trac-nghiem',
      prompt: str(q.prompt, 10_000) ?? '',
    }
  })
  return buildDeOnlineSystem({
    meta: { title: str(m.title, 500) ?? '', subject, grade },
    questions,
  })
}

function maTran(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const subject = str(o.subject, 100)
  if (subject === undefined) return null
  if (typeof o.grade !== 'number' || !Number.isFinite(o.grade)) return null
  if (!Array.isArray(o.chapters)) return null
  const chapters = o.chapters
    .slice(0, 100)
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.slice(0, 300))
  return buildMaTranSystem({ subject, grade: o.grade, chapters })
}

const TASKS: Record<string, (input: unknown) => string | null> = {
  'slide-chat': slideChat,
  'bang-ve': bangVe,
  'slide-lo': slideLo,
  'slide-trang': slideTrang,
  'slide-sua': slideSua,
  'tim-web': () => WEB_SEARCH_SYSTEM,
  'soan-de': soanDe,
  'hoi-truoc': hoiTruoc,
  'de-online': deOnline,
  'sua-cau': buildSuaCauSystem,
  've-do-thi': buildVeDoThiSystem,
  'chon-hinh': buildChonHinhSystem,
  'ngan-hang': buildNganHangSystem,
  'ma-tran': maTran,
  'sua-slide': buildSuaSlideSystem,
}

export function buildTaskSystem(task: unknown, input: unknown): string | null {
  if (typeof task !== 'string' || !Object.hasOwn(TASKS, task)) return null
  return TASKS[task]?.(input) ?? null
}
