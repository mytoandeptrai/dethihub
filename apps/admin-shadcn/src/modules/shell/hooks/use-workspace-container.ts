'use client'

import { usePathname } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'

export function useWorkspaceContainer() {
  const pathname = usePathname()
  const titles: Record<string, string> = {
    [appPaths.myDocs.href]: t('product.myDocs'),
    [appPaths.myDocs.analytics]: t('product.analytics'),
    [appPaths.onlineExams.href]: t('product.online'),
    [appPaths.grading.href]: t('product.grading'),
    [appPaths.library.href]: t('product.library'),
    [appPaths.community.href]: t('product.community'),
    [appPaths.admin.users]: t('product.users'),
    [appPaths.admin.content]: t('product.content'),
    [appPaths.admin.bank]: t('product.bank'),
    [appPaths.admin.stats]: t('product.stats'),
    [appPaths.admin.payments]: t('product.payments'),
    [appPaths.admin.ai]: t('product.ai'),
    [appPaths.admin.audit]: t('product.audit'),
  }
  const student = [
    [appPaths.play.getHref(''), t('product.studentPlay')],
    [appPaths.quiz.getHref(''), t('product.studentQuiz')],
    [appPaths.exams.getHref(''), t('product.studentExam')],
  ].find(([prefix]) => prefix !== undefined && pathname.startsWith(prefix))
  return { title: titles[pathname] ?? student?.[1] ?? t('common.brand') }
}
