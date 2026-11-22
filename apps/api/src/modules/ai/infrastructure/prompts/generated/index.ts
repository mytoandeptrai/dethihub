import * as raw from '@/modules/ai/infrastructure/prompts/generated/prompts.generated'

import type { SourceInput } from '@/modules/ai/infrastructure/prompts/sources'

export interface DeckPlan {
  slides: { title: string; layout: string }[]
  [key: string]: unknown
}

export interface SlideChatInput extends SourceInput {
  variant: 'plan' | 'chat' | 'html'
  pro?: boolean
  think?: boolean
  ask?: boolean
  contextSummary?: string
  webFound?: string
}

export interface BoardInput extends SourceInput {
  ops?: boolean
  think?: boolean
  contextSummary?: string
}

export const WEB_SEARCH_SYSTEM = raw.WEB_SEARCH_SYSTEM as string
export const buildSlideChatSystem = raw.buildSlideChatSystem as (input: SlideChatInput) => string
export const buildBoardSystem = raw.buildBoardSystem as (input: BoardInput) => string
export const buildSlideBatchSystem = raw.buildSlideBatchSystem as (
  plan: DeckPlan,
  indices: number[],
  think?: boolean,
  pro?: boolean,
) => string
export const buildSlidePageSystem = raw.buildSlidePageSystem as (
  plan: DeckPlan,
  index: number,
  pro?: boolean,
) => string
export const buildSlideEditSystem = raw.buildSlideEditSystem as (context: string) => string
export const slidePlanSystem = raw.slidePlanSystem as (pro?: boolean) => string
export const SLIDE_PLAN_SYSTEM = raw.SLIDE_PLAN_SYSTEM as string
