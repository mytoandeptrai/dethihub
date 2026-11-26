'use client'

import {
  confirmPublishWithoutKey,
  currentSession,
  lib_onlineExam_itemToDoc as itemToDoc,
  lib_onlineExam_itemToExam as itemToExam,
  store_online_useOnline as useOnline,
} from '@online-exams-engine'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { examsKeys, myExamSaveMutation, myExamSetListedMutation } from '@/apis/exams'
import { t } from '@/i18n/translate-online-exams'
import { FEATURE_DISABLED_MESSAGE } from '@/modules/feature-access/components/feature-notice'
import { useFeatureAccess } from '@/modules/feature-access/hooks/use-feature-access'

import type { lib_onlineExam_OnlineItem as OnlineItem } from '@online-exams-engine'

export function useOnlinePublication() {
  const access = useFeatureAccess()
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: examsKeys.all })
  const save = useMutation({ ...myExamSaveMutation(), onSuccess: invalidate })
  const listed = useMutation({ ...myExamSetListedMutation(), onSuccess: invalidate })
  const publish = async (item: OnlineItem, visible: boolean) => {
    if (!access.canUse('online')) throw new Error(FEATURE_DISABLED_MESSAGE)
    if (!(await currentSession())) throw new Error(t('onlineExamsCopy.needLogin'))
    if (!(await confirmPublishWithoutKey(itemToExam(item))))
      throw new Error(t('onlineExamsCopy.cancelPublish'))
    const row = await save.mutateAsync({
      id: item.publishedId,
      body: { doc: itemToDoc(item) as unknown as Record<string, unknown>, listed: visible },
    })
    useOnline.getState().update(item.id, { publishedId: row.id, publishedListed: row.listed })
    return row.id
  }
  const changeListed = async (item: OnlineItem, visible: boolean) => {
    if (!access.canUse('online')) throw new Error(FEATURE_DISABLED_MESSAGE)
    if (!item.publishedId) return
    if (!(await currentSession())) throw new Error(t('onlineExamsCopy.needLogin'))
    await listed.mutateAsync({
      params: { path: { id: item.publishedId } },
      body: { listed: visible },
    })
    useOnline.getState().update(item.id, { publishedListed: visible })
  }
  return { publish, changeListed }
}
