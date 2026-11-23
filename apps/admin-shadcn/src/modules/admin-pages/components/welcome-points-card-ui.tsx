'use client'
import { cn } from '@workspace/ui/lib/utils'

import { SiteButton as Button, Card, Spinner, inputClass } from '@/components/product-ui'
import { t } from '@/i18n/translate'

import type { WelcomePointsCardParts as Imported0 } from '@/modules/admin-pages/containers/welcome-points-card-container/welcome-points-card-container'
import type { WelcomePointsCardModel } from '@/modules/admin-pages/hooks'
export function WelcomePointsCardWelcomePointsCardUi(
  props: ReturnType<typeof WelcomePointsCardModel.useWelcomePointsCardContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const { value, setValue, saving, save } = props
    return (
      <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
        <div className="border-line mb-4 border-b pb-4">
          <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m246')}</h2>
          <p className="text-ink-3 text-[12.5px]">{t('adminOpsCopy.m250')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="welcome-points"
              className="text-ink mb-1.5 block text-[13px] font-medium"
            >
              {t('adminOpsCopy.m251')}
            </label>
            <input
              id="welcome-points"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replaceAll(/\D/g, '').slice(0, 5))}
              className={cn(inputClass, 'w-32 text-[13.5px]')}
              disabled={saving}
            />
          </div>
          <Button variant="clay" size="sm" onClick={save} disabled={saving || value === ''}>
            {saving ? <Spinner className="size-3.5" /> : null}
            <span>{t('adminOpsCopy.m197')}</span>
          </Button>
        </div>
      </Card>
    )
  }
  return null
}
