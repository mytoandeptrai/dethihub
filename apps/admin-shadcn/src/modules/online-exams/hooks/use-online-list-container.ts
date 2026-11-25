'use client'

import { dialog } from '@engine-dialogs'
import {
  lib_onlineExam_itemToExam as itemToExam,
  lib_onlineExam_loadForQuiz as loadForQuiz,
  lib_onlineExam_questionIssue as questionIssue,
  useNavigate,
  store_online_useOnline as useOnline,
} from '@online-exams-engine'
import { useState } from 'react'

import { appPaths } from '@/config/app-paths'
import { usePaged, useClientReady, useUrlState } from '@/hooks'
import { t } from '@/i18n/translate'
import { useOnlinePublication } from '@/modules/online-exams/hooks/use-online-publication'
import { useFeatureAccess } from '@/modules/feature-access/hooks/use-feature-access'

import type { lib_onlineExam_OnlineItem as OnlineItem } from '@online-exams-engine'
export type Tab = 'history' | 'published'
export function useOnlineListContainer() {
  const access = useFeatureAccess()
  const ready = useClientReady()
  const navigate = useNavigate()
  const [tab, setTab] = useUrlState<Tab>('tab', 'history', ['history', 'published'])
  const stored = useOnline((s) => s.items)
  const items = ready ? stored : []
  const paged = usePaged(items, 12)
  const create = useOnline((s) => s.create)
  const remove = useOnline((s) => s.remove)
  return {
    viewState: 0 as const,
    items,
    canCreate: access.canUse('online'),
    staffDisabled: access.isStaff && access.isDisabled('online'),
    onCreate: () => navigate(access.canUse('online') ? appPaths.onlineExams.getHref(create()) : appPaths.onlineExams.getHref('new')),
    tab,
    setTab,
    paged,
    remove,
  }
}
export function useItemCardContainer({
  item,
  index,
  onDelete,
}: {
  item: OnlineItem
  index: number
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const publication = useOnlinePublication()
  const access = useFeatureAccess()
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const exam = itemToExam(item)
  const issues = item.questions.filter((q) => questionIssue(q)).length
  const playable = item.questions.length > 0 && issues === 0
  const published = Boolean(item.publishedId)
  const publish = async (listed: boolean) => {
    if (!access.canUse('online')) return
    setBusy(true)
    setFormError(null)
    try {
      await publication.publish(item, listed)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('onlineExamsCopy.m75'))
    } finally {
      setBusy(false)
    }
  }
  const requestDelete = async () => {
    if (
      await dialog.confirm(t('onlineExamsCopy.m104'), {
        title: t('onlineExamsCopy.m105', {
          value0: item.meta.title.trim() || t('onlineExamsCopy.m91'),
        }),
        confirmLabel: t('onlineExamsCopy.m8'),
        danger: true,
      })
    )
      onDelete()
  }
  return {
    viewState: 0 as const,
    index,
    item,
    published,
    readOnly: !access.canUse('online'),
    exam,
    onEdit: () => navigate(appPaths.onlineExams.getHref(item.id)),
    onQuiz: () => navigate(appPaths.quiz.getHref(loadForQuiz(item))),
    playable,
    busy,
    publish,
    requestDelete,
    error: formError,
  }
}
