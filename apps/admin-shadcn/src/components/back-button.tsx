'use client'

import { Button } from '@workspace/ui/components/button'
import { useRouter } from 'next/navigation'

import { t } from '@/i18n/translate'

export function BackButton() {
  const router = useRouter()
  return (
    <Button variant="outline" onClick={() => router.back()}>
      {t('common.back')}
    </Button>
  )
}
