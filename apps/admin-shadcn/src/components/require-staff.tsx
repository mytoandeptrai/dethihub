'use client'

import { useRequireStaff } from '@/hooks/use-require-staff'
import { t } from '@/i18n/translate'

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireStaff()
  return isLoading ? <p role="status">{t('common.loading')}</p> : children
}
