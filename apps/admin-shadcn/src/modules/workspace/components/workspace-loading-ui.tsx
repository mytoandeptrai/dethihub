import { Skeleton } from '@workspace/ui/components/skeleton'

import { t } from '@/i18n/translate'

export function WorkspaceLoadingUi() {
  return (
    <div
      role="status"
      aria-label={t('workspaceCopy.m46')}
      className="mx-auto max-w-[1180px] space-y-5 px-4 py-8 sm:px-6 sm:py-12"
    >
      <Skeleton className="h-10 w-60" />
      <Skeleton className="h-28 w-full" />
    </div>
  )
}
