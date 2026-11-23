'use client'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Activity, Check, RefreshCw } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  EmptyState,
  PageHeader,
  Segmented,
  Spinner,
  inputClass,
} from '@/components/product-ui'
import { t } from '@/i18n/translate'
import { AdminTable } from '@/modules/admin-pages/components/admin-primitives-ui'
import AnnouncementsEditor from '@/modules/admin-pages/containers/announcements-editor-container'
import DbStatusCard from '@/modules/admin-pages/containers/db-status-card-container'
import HealthDrawer from '@/modules/admin-pages/containers/health-drawer-container'
import Switch from '@/modules/admin-pages/containers/switch-container'
import WelcomePointsCard from '@/modules/admin-pages/containers/welcome-points-card-container'
import { OpsPanelModel } from '@/modules/admin-pages/hooks'
import { formatNumber, formatViDateTime } from '@/modules/admin-pages/hooks/admin-utils'

import type { OpsPanelParts as Imported0 } from '@/modules/admin-pages/containers/ops-panel-container/ops-panel-container'
const { formatLatency, formatViTime } = OpsPanelModel
export function OpsPanelOpsPanelUi(
  props: ReturnType<typeof OpsPanelModel.useOpsPanelContainer> & {
    parts: typeof Imported0
  },
) {
  if (props.viewState === 0) {
    const {
      notice,
      savedMaintOn,
      maintOn,
      loadingSettings,
      opsTab,
      setOpsTab,
      handleToggleMaintenance,
      savingMaint,
      maintMessage,
      setMaintMessage,
      maintUntil,
      setMaintUntil,
      handleSaveMaintenance,
      settings,
      showNotice,
      healthCheckedAt,
      handleRunHealth,
      runningHealth,
      healthRows,
      healthResults,
      checkingOne,
      setHealthDrawer,
      handleCheckOne,
      healthDrawer,
      setHealthProviders,
      statDays,
      setStatDays,
      loadingStats,
      totalCalls,
      errorRateStr,
      totalTokens,
      totalCostStr,
      chartDays,
      maxDailyCalls,
      modelStats,
      loadErrors,
      loadingErrors,
      aiErrors,
      freeEmpty,
    } = props
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={t('adminOpsCopy.m124')} className="mb-0 [&_h1]:text-2xl" />
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            className="bg-sage-soft text-sage flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-medium shadow-xs"
          >
            <Check className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
          <div className="border-line mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m125')}</h2>
              {savedMaintOn || maintOn ? (
                <Badge tone="clay" className="text-[11px]">
                  {t('adminOpsCopy.m126')}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {loadingSettings ? <Spinner className="text-ink-3 size-3.5" /> : null}
              <Segmented<'maint' | 'notice'>
                value={opsTab}
                onChange={setOpsTab}
                label={t('adminOpsCopy.m127')}
                options={[
                  { key: 'maint', label: t('adminOpsCopy.m128') },
                  { key: 'notice', label: t('adminOpsCopy.m129') },
                ]}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className={cn('anim-tab-in space-y-4', opsTab !== 'maint' && 'hidden')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-ink text-[14.5px] font-semibold">
                      {t('adminOpsCopy.m130')}
                    </h3>
                    {savedMaintOn || maintOn ? (
                      <Badge tone="clay" className="text-[11px]">
                        {t('adminOpsCopy.m126')}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-ink-3 text-[12.5px]">{t('adminOpsCopy.m131')}</p>
                </div>
                <Switch
                  id="switch-maintenance"
                  checked={maintOn}
                  onChange={handleToggleMaintenance}
                  disabled={savingMaint || loadingSettings}
                  label={maintOn ? t('adminOpsCopy.m114') : t('adminOpsCopy.m132')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="maint-message" className="text-ink text-[13px] font-medium">
                      {t('adminOpsCopy.m133')}
                    </label>
                    <span className="text-ink-4 text-[11.5px]">
                      {maintMessage.length}
                      {t('adminOpsCopy.m134')}
                    </span>
                  </div>
                  <textarea
                    id="maint-message"
                    value={maintMessage}
                    onChange={(e) => setMaintMessage(e.target.value.slice(0, 500))}
                    maxLength={500}
                    rows={3}
                    placeholder={t('adminOpsCopy.m135')}
                    className={cn(inputClass, 'w-full resize-y text-[13.5px]')}
                    disabled={savingMaint || loadingSettings}
                  />
                </div>

                <div>
                  <label
                    htmlFor="maint-until"
                    className="text-ink mb-1.5 block text-[13px] font-medium"
                  >
                    {t('adminOpsCopy.m136')}
                  </label>
                  <input
                    id="maint-until"
                    type="datetime-local"
                    value={maintUntil}
                    onChange={(e) => setMaintUntil(e.target.value)}
                    className={cn(inputClass, 'w-full text-[13.5px]')}
                    disabled={savingMaint || loadingSettings}
                  />
                  <p className="text-ink-4 mt-1.5 text-[11.5px]">{t('adminOpsCopy.m137')}</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="clay"
                  size="sm"
                  onClick={handleSaveMaintenance}
                  disabled={savingMaint || loadingSettings}
                >
                  {savingMaint ? <Spinner className="size-3.5" /> : null}
                  <span>{t('adminOpsCopy.m138')}</span>
                </Button>
              </div>
            </div>

            {settings ? (
              <div className={cn('anim-tab-in', opsTab !== 'notice' && 'hidden')}>
                <AnnouncementsEditor initial={settings.announcements.items} onNotice={showNotice} />
              </div>
            ) : null}
          </div>
        </Card>

        {settings ? (
          <WelcomePointsCard initial={settings.aiWelcome?.points ?? null} onNotice={showNotice} />
        ) : null}

        <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
          <div className="border-line mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m139')}</h2>
              <p className="text-ink-3 text-[12.5px]">{t('adminOpsCopy.m140')}</p>
            </div>
            <div className="flex items-center gap-3">
              {healthCheckedAt ? (
                <span className="text-ink-3 text-[12.5px] font-medium">
                  {t('adminOpsCopy.m141')}
                  {formatViTime(healthCheckedAt)}
                </span>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunHealth}
                disabled={runningHealth}
              >
                {runningHealth ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Activity className="text-clay size-3.5" />
                )}
                <span>{runningHealth ? t('adminOpsCopy.m142') : t('adminOpsCopy.m143')}</span>
              </Button>
            </div>
          </div>

          <DbStatusCard />

          <div className="divide-line-2 border-line divide-y rounded-[6px] border">
            {healthRows.map((row) => {
              const result = healthResults[row.key]
              const busy = runningHealth || checkingOne.includes(row.key)
              const open = () => row.target && setHealthDrawer(row.target)
              return (
                <div
                  key={row.key}
                  role="button"
                  tabIndex={0}
                  aria-label={t('adminOpsCopy.m144', { value0: row.name })}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && e.key === 'Enter') open()
                  }}
                  className="hover:bg-paper-2/80 flex cursor-pointer flex-col gap-2 p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        result ? (result.ok ? 'bg-sage' : 'bg-clay') : 'bg-line-2',
                      )}
                    />
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                      <row.icon className="text-ink-3 size-4 shrink-0" />
                      <span className="text-ink text-[13.5px] font-semibold">{row.name}</span>
                      <span className="text-ink-4 text-[12px]">{row.note}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    {result?.error ? (
                      <span
                        className="text-clay max-w-[140px] truncate font-mono text-[12px] sm:max-w-[220px]"
                        data-tip={result.error}
                      >
                        {result.error}
                      </span>
                    ) : null}
                    {result ? (
                      <span className="tnum text-ink-2 font-mono text-[12.5px]">
                        {formatLatency(result.ms)}
                      </span>
                    ) : null}
                    <Badge tone={result ? (result.ok ? 'sage' : 'clay') : 'neutral'}>
                      {result
                        ? result.ok
                          ? t('adminOpsCopy.m146')
                          : t('adminOpsCopy.m54')
                        : t('adminOpsCopy.m145')}
                    </Badge>
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleCheckOne(row.key)
                      }}
                      disabled={busy}
                      aria-label={t('adminOpsCopy.m147', { value0: row.name })}
                    >
                      {busy ? <Spinner className="size-3.5" /> : null}
                      <span>{t('adminOpsCopy.m148')}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          {healthDrawer ? (
            <HealthDrawer
              target={healthDrawer}
              onClose={() => setHealthDrawer(null)}
              onSaved={(providers, provider) => {
                setHealthProviders(providers)
                showNotice(t('adminOpsCopy.m149', { value0: provider }))
                void handleCheckOne(provider)
              }}
            />
          ) : null}
        </Card>

        <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
          <div className="border-line mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m150')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Segmented<'7' | '30'>
                value={statDays}
                onChange={setStatDays}
                label={t('adminOpsCopy.m151')}
                options={[
                  { key: '7', label: t('adminOpsCopy.m6') },
                  { key: '30', label: t('adminOpsCopy.m7') },
                ]}
              />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="border-line bg-surface min-w-0 rounded-[6px] border p-3.5 shadow-xs sm:p-4">
              <span className="text-ink-3 text-[12px] font-medium">{t('adminOpsCopy.m152')}</span>
              <div className="mt-1">
                {loadingStats ? (
                  <Spinner className="text-ink-3 size-4" />
                ) : (
                  <span className="tnum text-ink block truncate text-[18px] font-bold tracking-tight sm:text-[24px] lg:text-[26px]">
                    {formatNumber(totalCalls)}
                  </span>
                )}
              </div>
            </div>

            <div className="border-line bg-surface min-w-0 rounded-[6px] border p-3.5 shadow-xs sm:p-4">
              <span className="text-ink-3 text-[12px] font-medium">{t('adminOpsCopy.m153')}</span>
              <div className="mt-1">
                {loadingStats ? (
                  <Spinner className="text-ink-3 size-4" />
                ) : (
                  <span className="tnum text-ink block truncate text-[18px] font-bold tracking-tight sm:text-[24px] lg:text-[26px]">
                    {errorRateStr}
                  </span>
                )}
              </div>
            </div>

            <div className="border-line bg-surface min-w-0 rounded-[6px] border p-3.5 shadow-xs sm:p-4">
              <span className="text-ink-3 text-[12px] font-medium">{t('adminOpsCopy.m154')}</span>
              <div className="mt-1">
                {loadingStats ? (
                  <Spinner className="text-ink-3 size-4" />
                ) : (
                  <span
                    className="tnum text-ink block truncate text-[18px] font-bold tracking-tight sm:text-[24px] lg:text-[26px]"
                    data-tip={formatNumber(totalTokens)}
                  >
                    {formatNumber(totalTokens)}
                  </span>
                )}
              </div>
            </div>

            <div className="border-line bg-surface min-w-0 rounded-[6px] border p-3.5 shadow-xs sm:p-4">
              <span className="text-ink-3 text-[12px] font-medium">{t('adminOpsCopy.m155')}</span>
              <div className="mt-1">
                {loadingStats ? (
                  <Spinner className="text-ink-3 size-4" />
                ) : (
                  <span className="tnum text-ink block truncate text-[18px] font-bold tracking-tight sm:text-[24px] lg:text-[26px]">
                    {totalCostStr}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-line bg-surface mb-6 rounded-[6px] border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-ink text-[13.5px] font-semibold">{t('adminOpsCopy.m156')}</h3>
                <p className="text-ink-4 text-[11.5px]" />
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="bg-sage size-2.5 rounded-[2px]" />
                  <span className="text-ink-3">{t('adminOpsCopy.m157')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-clay size-2.5 rounded-[2px]" />
                  <span className="text-ink-3">{t('adminOpsCopy.m54')}</span>
                </div>
              </div>
            </div>

            {loadingStats ? (
              <div className="text-ink-3 flex h-44 items-center justify-center">
                <Spinner className="mr-2 size-4" />
                <span className="text-[13px]">{t('adminOpsCopy.m158')}</span>
              </div>
            ) : chartDays.length === 0 ? (
              <div className="text-ink-4 flex h-44 items-center justify-center text-[13px]">
                {t('adminOpsCopy.m159')}
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-2">
                <div className="border-line flex h-48 min-w-[320px] items-end gap-1.5 border-b px-1 pt-6 sm:gap-2.5">
                  {chartDays.map((d) => {
                    const heightPercent = Math.max(4, Math.round((d.calls / maxDailyCalls) * 100))
                    const errPercent = d.calls > 0 ? (d.errors / d.calls) * 100 : 0
                    const succPercent = 100 - errPercent
                    const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`
                    return (
                      <div
                        key={d.day}
                        className="group relative flex h-full min-w-[16px] flex-1 flex-col items-center justify-end"
                      >
                        <div
                          className="flex w-full justify-center"
                          style={{ height: `${heightPercent}%` }}
                          data-tip={t('adminOpsCopy.m160', {
                            value0: label,
                            value1: formatNumber(d.calls),
                            value2: formatNumber(d.success),
                            value3: formatNumber(d.errors),
                          })}
                        >
                          <div className="bg-sunken/40 flex h-full w-full max-w-[32px] flex-col justify-end overflow-hidden rounded-t-[3px] transition-all group-hover:brightness-95">
                            {d.errors > 0 ? (
                              <div
                                className="bg-clay w-full transition-all"
                                style={{ height: `${errPercent}%` }}
                              />
                            ) : null}
                            <div
                              className="bg-sage w-full transition-all"
                              style={{ height: `${succPercent}%` }}
                            />
                          </div>
                        </div>

                        <span className="text-ink-4 group-hover:text-ink mt-2 text-[10.5px] font-medium whitespace-nowrap select-none">
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-ink text-[13.5px] font-semibold">{t('adminOpsCopy.m161')}</h3>
            <div className="border-line w-full overflow-hidden rounded-[6px] border">
              <div className="max-h-[65vh] w-full overflow-auto overscroll-contain">
                <AdminTable className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[11.5px] font-semibold tracking-wider uppercase">
                    <tr>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m162')}</th>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m163')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m164')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m54')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m165')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m166')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m167')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-line-2 divide-y">
                    {loadingStats ? (
                      <tr>
                        <td colSpan={7} className="text-ink-3 py-8 text-center">
                          <Skeleton className="mr-2 inline-block h-5 w-24 align-middle" />
                          <span>{t('adminOpsCopy.m168')}</span>
                        </td>
                      </tr>
                    ) : modelStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-ink-4 py-8 text-center">
                          <EmptyState title={t('adminOpsCopy.m169')} />
                        </td>
                      </tr>
                    ) : (
                      modelStats.map((item) => (
                        <tr
                          key={`${item.provider}-${item.model}`}
                          className="hover:bg-sunken/30 transition-colors"
                        >
                          <td className="text-ink px-4 py-2.5 font-medium">{item.model}</td>
                          <td className="text-ink-3 px-4 py-2.5">{item.provider}</td>
                          <td className="tnum text-ink px-4 py-2.5 text-right font-mono">
                            {formatNumber(item.calls)}
                          </td>
                          <td className="tnum px-4 py-2.5 text-right font-mono">
                            {item.errors > 0 ? (
                              <span className="text-clay font-semibold">
                                {formatNumber(item.errors)}
                              </span>
                            ) : (
                              <span className="text-ink-4">{t('adminOpsCopy.m170')}</span>
                            )}
                          </td>
                          <td className="tnum text-ink px-4 py-2.5 text-right font-mono">
                            {formatNumber(item.tokens)}
                          </td>
                          <td className="tnum text-ink px-4 py-2.5 text-right font-mono">
                            {item.cost}
                          </td>
                          <td className="tnum text-ink-2 px-4 py-2.5 text-right font-mono">
                            {formatLatency(item.avgMs)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </AdminTable>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-line shadow-soft overflow-hidden border p-5 sm:p-6">
          <div className="border-line mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-ink text-[17px] font-bold">{t('adminOpsCopy.m171')}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={loadErrors} disabled={loadingErrors}>
              <RefreshCw className={cn('size-3.5', loadingErrors && 'animate-spin')} />
              <span>{t('adminOpsCopy.m95')}</span>
            </Button>
          </div>

          {loadingErrors ? (
            <div className="text-ink-3 py-12 text-center">
              <Spinner className="text-ink-3 mr-2 size-4" />
              <span className="text-[13px]">{t('adminOpsCopy.m172')}</span>
            </div>
          ) : aiErrors.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Check className="text-sage size-6" />}
                title={t('adminOpsCopy.m173')}
              />
            </div>
          ) : (
            <div className="border-line w-full overflow-hidden rounded-[6px] border">
              <div className="max-h-[65vh] w-full overflow-auto overscroll-contain">
                <AdminTable className="w-full min-w-[800px] border-collapse text-left text-[13px]">
                  <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[11.5px] font-semibold tracking-wider uppercase">
                    <tr>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m174')}</th>
                      <th className="min-w-[160px] px-4 py-2.5 whitespace-nowrap">
                        {t('adminOpsCopy.m175')}
                      </th>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m162')}</th>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m163')}</th>
                      <th className="px-4 py-2.5">{t('adminOpsCopy.m54')}</th>
                      <th className="px-4 py-2.5 text-right">{t('adminOpsCopy.m176')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-line-2 divide-y">
                    {aiErrors.map((err) => (
                      <tr key={err.id} className="hover:bg-sunken/30 transition-colors">
                        <td className="tnum text-ink-3 px-4 py-2.5 font-mono text-[12px] whitespace-nowrap">
                          {formatViDateTime(err.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-ink font-medium [overflow-wrap:anywhere]">
                            {err.userName || err.userEmail || '—'}
                          </div>
                          {err.userName && err.userEmail && err.userEmail !== err.userName && (
                            <div className="text-ink-3 text-[12px] [overflow-wrap:anywhere]">
                              {err.userEmail}
                            </div>
                          )}
                          {(err.error?.includes('empty content') ||
                            err.error?.includes(t('adminOpsCopy.m177'))) &&
                            typeof err.emptyDay === 'number' &&
                            err.emptyDay > 0 && (
                              <div
                                className={cn(
                                  'tnum text-[12px] whitespace-nowrap',
                                  typeof freeEmpty === 'number' && err.emptyDay >= freeEmpty
                                    ? 'text-clay'
                                    : 'text-ink-3',
                                )}
                              >
                                {err.emptyDay}
                                {t('adminOpsCopy.m178')}
                              </div>
                            )}
                        </td>
                        <td className="text-ink px-4 py-2.5 font-medium whitespace-nowrap">
                          {err.model}
                        </td>
                        <td className="text-ink-3 px-4 py-2.5 whitespace-nowrap">{err.provider}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="text-clay block max-w-[240px] truncate font-mono text-[12px] sm:max-w-[360px] md:max-w-[460px]"
                            data-tip={err.error ?? ''}
                          >
                            {err.error || '—'}
                          </span>
                        </td>
                        <td className="tnum text-ink-2 px-4 py-2.5 text-right font-mono whitespace-nowrap">
                          {formatLatency(err.ms)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            </div>
          )}
        </Card>
      </div>
    )
  }
  return null
}
