'use client'

import { lib_onlinePublish_shareUrl as shareUrl } from '@online-exams-engine'
import { useState } from 'react'

import { t } from '@/i18n/translate'

import type {
  lib_community_CommunityRow as CommunityRow,
  lib_attempts_ExamStats as ExamStats,
  lib_attempts_Student as Student,
} from '@online-exams-engine'
export const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',')
export const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
export const BAND_LABEL = [
  t('onlineExamsCopy.m214'),
  t('onlineExamsCopy.m215'),
  t('onlineExamsCopy.m216'),
  t('onlineExamsCopy.m217'),
]
export const BAND_COLOR = ['bg-clay', 'bg-honey', 'bg-sage/60', 'bg-sage']
export const MEDAL = [
  { ring: '#d4a017', fill: 'linear-gradient(145deg,#fde68a,#e0a82e 55%,#b7791f)', text: '#7a4d00' },
  { ring: '#9ca3af', fill: 'linear-gradient(145deg,#f3f4f6,#c0c4cb 55%,#8b9099)', text: '#3f4652' },
  { ring: '#b4693a', fill: 'linear-gradient(145deg,#f6c9a4,#c9814f 55%,#94522a)', text: '#5a2c10' },
]
export const PODIUM_H = ['h-[132px]', 'h-[96px]', 'h-[72px]']

export function usePublishedCardContainer({
  row,
  index,
  stats,
  busy,
  localId,
  onResults,
  onToggleListed,
  onRemove,
  onEdit,
}: {
  row: CommunityRow
  index: number
  stats: ExamStats | undefined
  busy: boolean
  localId: string | undefined
  onResults: () => void
  onToggleListed: () => void
  onRemove: () => void
  onEdit: (localId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const url = shareUrl(row.id)
  const copy = () =>
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  const total = stats?.students.length ?? 0
  return {
    viewState: 0 as const,
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
  }
}
export function useIconBtnContainer({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return { viewState: 0 as const, label, onClick, disabled, danger, children }
}
export function useStatContainer({ label, value }: { label: string; value: string }) {
  return { viewState: 0 as const, label, value }
}
export function useBandsContainer({ bands }: { bands: ExamStats['bands'] }) {
  const sum = bands.reduce((a, b) => a + b, 0)
  return { viewState: 0 as const, bands, sum }
}
export function usePodiumContainer({ top }: { top: Student[] }) {
  const order = [1, 0, 2].filter((i) => top[i])
  return { viewState: 0 as const, order, top }
}

export {
  useOnlineResultsContainer,
  usePublishedPanelContainer,
} from '@/modules/online-exams/hooks/use-published-data-container'

export { PAGE, DEMO_ROW, demoAttempts } from './published-demo'
