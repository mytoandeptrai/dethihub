'use client'
import { components_appIcons_TrashIcon as TrashIcon } from '@admin-pages-engine'
import { cn } from '@workspace/ui/lib/utils'
import { Plus } from 'lucide-react'

import { SiteButton as Button, Card, Spinner, inputClass } from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { AdminTable } from '@/modules/admin-pages/components/admin-primitives-ui'
import { PricingEditorModel } from '@/modules/admin-pages/hooks'

import type { PricingEditorParts as Imported0 } from '@/modules/admin-pages/containers/pricing-editor-container/pricing-editor-container'
const { fmt, toNum } = PricingEditorModel
export function PricingEditorPricingEditorUi(
  props: ReturnType<typeof PricingEditorModel.usePricingEditorContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const {
      save,
      saving,
      rate,
      setRate,
      minVnd,
      setMinVnd,
      maxVnd,
      setMaxVnd,
      rows,
      ratio,
      patch,
      defaultKey,
      setDefaultKey,
      setRows,
    } = props
    return (
      <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
        <div className="border-line mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m209')}</h2>
          <Button variant="primary" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <Spinner className="size-3.5" /> : null}
            {t('adminOpsCopy.m210')}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-ink-2 block text-[13px] font-semibold">
            {t('adminOpsCopy.m211')}
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={rate}
              onChange={(e) => setRate(e.target.value.replaceAll(/\D/g, ''))}
            />
          </label>
          <label className="text-ink-2 block text-[13px] font-semibold">
            {t('adminOpsCopy.m212')}
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={minVnd}
              onChange={(e) => setMinVnd(fmt(toNum(e.target.value)))}
            />
          </label>
          <label className="text-ink-2 block text-[13px] font-semibold">
            {t('adminOpsCopy.m213')}
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={maxVnd}
              onChange={(e) => setMaxVnd(fmt(toNum(e.target.value)))}
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <AdminTable className="w-full min-w-[480px] text-[13px]">
            <thead>
              <tr className="text-ink-3 text-left text-[12px] font-semibold whitespace-nowrap">
                <th className="pr-3 pb-2 font-semibold">{t('adminOpsCopy.m214')}</th>
                <th className="pr-3 pb-2 font-semibold">{t('adminOpsCopy.m215')}</th>
                <th className="pr-3 pb-2 font-semibold">{t('adminOpsCopy.m216')}</th>
                <th className="pr-3 pb-2 font-semibold">{t('adminOpsCopy.m217')}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const base = Math.floor((toNum(r.vnd) / 1000) * ratio + 1e-9)
                const withBonus = Math.floor(
                  base * (1 + (Number(r.bonus.replace(',', '.')) || 0) / 100) + 1e-9,
                )
                return (
                  <tr key={r.key} className="border-line border-t">
                    <td className="py-2 pr-3">
                      <input
                        className={cn(inputClass, 'w-32')}
                        inputMode="numeric"
                        value={r.vnd}
                        onChange={(e) => patch(r.key, { vnd: fmt(toNum(e.target.value)) })}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={cn(inputClass, 'w-24')}
                        inputMode="decimal"
                        value={r.bonus}
                        onChange={(e) =>
                          patch(r.key, { bonus: e.target.value.replaceAll(/[^\d.,]/g, '') })
                        }
                      />
                    </td>
                    <td className="tnum text-ink-2 py-2 pr-3">
                      {fmt(base)}
                      {withBonus > base ? (
                        <span className="text-clay">
                          {t('adminOpsCopy.m218')}
                          {fmt(withBonus)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="radio"
                        name="pricing-default"
                        checked={defaultKey === i}
                        onChange={() => setDefaultKey(i)}
                        className="accent-clay"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        data-tip={t('adminOpsCopy.m219')}
                        disabled={rows.length <= 1}
                        onClick={() => {
                          setRows((list) => list.filter((x) => x.key !== r.key))
                          setDefaultKey((d) => (d === i ? 0 : d > i ? d - 1 : d))
                        }}
                        className="text-ink-3 hover:bg-sunken hover:text-ink rounded-[6px] p-1.5 disabled:opacity-40"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </AdminTable>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={rows.length >= 8}
          onClick={() =>
            setRows((list) => [...list, { key: crypto.randomUUID(), vnd: '', bonus: '0' }])
          }
        >
          <Plus className="size-3.5" />
          {t('adminOpsCopy.m220')}
        </Button>
      </Card>
    )
  }
  return null
}
