'use client'
import { TableRowsSkeleton, LoadingRegion, FormSkeleton } from '@/components/page-skeleton'
import {
  lib_llm_TOKENS_PER_POINT as TOKENS_PER_POINT,
  components_appIcons_TrashIcon as TrashIcon,
} from '@admin-pages-engine'
import { cn } from '@workspace/ui/lib/utils'
import { Ban, Check, Coins, Lock, Search, ShieldAlert, Unlock, Users, X } from 'lucide-react'

import {
  Avatar,
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  DropdownMenuItem,
  EmptyState,
  PageHeader,
  Pager,
  Segmented,

  Toolbar,
  inputClass,
} from '@/components/product-ui'
import { t as translate } from '@/i18n/translate'
import {
  AdminDrawer,
  AdminModal,
  AdminRowActions,
  AdminTable,
} from '@/modules/admin-pages/components/admin-primitives-ui'
import { UsersPanelModel } from '@/modules/admin-pages/hooks'
import {
  formatNumber,
  formatViDate,
  formatViDateTime,
  shortenId,
} from '@/modules/admin-pages/hooks/admin-utils'

import type {
  UsersPanelParts as Imported0,
  UsersPanelParts as Imported1,
  UsersPanelParts as Imported2,
  UsersPanelParts as Imported3,
  UsersPanelParts as Imported4,
  UsersPanelParts as Imported5,
} from '@/modules/admin-pages/containers/users-panel-container/users-panel-container'
const { BAN_DURATIONS, MB } = UsersPanelModel
export function UsersPanelUsersPanelUi(
  props: ReturnType<typeof UsersPanelModel.useUsersPanelContainer> & {
    parts: typeof Imported0
  },
) {
  const { UserDetailDrawer, UserAvatarWithPresence } = props.parts
  if (props.viewState === 0) {
    const {
      total,
      search,
      setSearch,
      loading,
      users,
      selectedUser,
      setSelectedUser,
      totalPages,
      page,
      setPage,
      loadUsers,
      setUsers,
      setTotal,
    } = props
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader title={translate('adminPagesCopy.m55')} className="mb-0 [&_h1]:text-2xl" />
            <p className="text-ink-3 text-[13.5px]">
              {total}
              {translate('adminPagesCopy.m56')}
            </p>
          </div>

          <Toolbar className="relative mb-0 w-full p-2 sm:w-80">
            <Search className="text-ink-4 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translate('adminPagesCopy.m57')}
              className={`${inputClass} pr-9 pl-9 text-[13.5px]`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-4 hover:bg-sunken hover:text-ink absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1"
                aria-label={translate('adminPagesCopy.m58')}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </Toolbar>
        </div>

        <Card className="border-line shadow-soft overflow-hidden border">
          <div className="max-h-[65vh] overflow-auto overscroll-contain">
            <AdminTable className="w-full min-w-[780px] border-collapse text-left text-[13.5px]">
              <thead className="border-line bg-sunken/80 text-ink-3 border-b text-[12px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m59')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m60')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m61')}</th>
                  <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m62')}</th>
                  <th className="px-4 py-3 text-right">{translate('adminPagesCopy.m63')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m64')}</th>
                  <th className="px-4 py-3">{translate('adminPagesCopy.m65')}</th>
                  <th aria-label={translate('adminPagesCopy.m66')} />
                </tr>
              </thead>
              <tbody className="divide-line-2 divide-y">
                {loading && users.length === 0 ? (
                  <TableRowsSkeleton columns={8} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <EmptyState
                        icon={<Users className="text-ink-4 size-6" />}
                        title={translate('adminPagesCopy.m68')}
                        description={
                          search
                            ? translate('adminPagesCopy.m69', { value0: String(search) })
                            : translate('adminPagesCopy.m70')
                        }
                        action={
                          search ? (
                            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                              {translate('adminPagesCopy.m71')}
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isBanned = Boolean(u.bannedUntil && new Date(u.bannedUntil) > new Date())
                    const isSelected = selectedUser?.id === u.id
                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`hover:bg-sunken/50 cursor-pointer transition-colors ${isSelected ? 'bg-sunken/70' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatarWithPresence user={u} className="size-8 text-[13px]" />
                            <div className="flex min-w-0 flex-col">
                              <span className="text-ink truncate font-semibold">
                                {u.name || (
                                  <span className="text-ink-3 font-normal italic">
                                    {translate('adminPagesCopy.m72')}
                                  </span>
                                )}
                              </span>
                              <span className="text-ink-3 hover:text-clay truncate text-[12px]">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="tnum text-ink-2 px-4 py-3 whitespace-nowrap">
                          {formatViDate(u.createdAt)}
                        </td>

                        <td className="tnum text-ink-2 px-4 py-3 whitespace-nowrap">
                          {u.lastSignInAt
                            ? formatViDateTime(u.lastSignInAt)
                            : translate('adminPagesCopy.m73')}
                        </td>

                        <td className="tnum text-ink-2 px-4 py-3 text-right font-medium whitespace-nowrap">
                          {u.docs}
                        </td>

                        <td className="tnum text-ink-2 px-4 py-3 text-right font-medium whitespace-nowrap">
                          {u.decks}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isBanned ? (
                            <Badge tone="clay">{translate('adminPagesCopy.m74')}</Badge>
                          ) : (
                            <Badge tone="sage">{translate('adminPagesCopy.m75')}</Badge>
                          )}
                          {u.flag ? (
                            <Badge tone="honey" className="ml-1.5">
                              {translate('adminPagesCopy.m76')}
                              {u.flag.strikes}
                            </Badge>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.role === 'admin' ? (
                            <Badge tone="clay">{translate('adminPagesCopy.m77')}</Badge>
                          ) : u.role === 'moderator' ? (
                            <Badge tone="neutral">{translate('adminPagesCopy.m78')}</Badge>
                          ) : (
                            <span className="text-ink-4 text-[13px]">
                              {translate('adminPagesCopy.m59')}
                            </span>
                          )}
                        </td>
                        <td>
                          <AdminRowActions>
                            <DropdownMenuItem onSelect={() => setSelectedUser(u)}>
                              {translate('adminPagesCopy.m79')}
                            </DropdownMenuItem>
                          </AdminRowActions>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </AdminTable>
          </div>

          {totalPages > 1 ? (
            <div className="border-line border-t px-4 py-3">
              <Pager page={page} pages={totalPages} go={(p) => setPage(p)} />
            </div>
          ) : null}
        </Card>

        {selectedUser ? (
          <UserDetailDrawer
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onReloadList={loadUsers}
            onDeleted={(id) => {
              setSelectedUser(null)
              setUsers((list) => list.filter((x) => x.id !== id))
              setTotal((t) => Math.max(0, t - 1))
              void loadUsers()
            }}
            onUserUpdated={(updated) => setSelectedUser(updated)}
          />
        ) : null}
      </div>
    )
  }
  return null
}
export function UsersPanelUserDetailDrawerUi(
  props: ReturnType<typeof UsersPanelModel.useUserDetailDrawerContainer> & {
    parts: typeof Imported1
  },
) {
  const { GrantCreditsModal, UserAvatarWithPresence, StorageSection } = props.parts
  if (props.viewState === 0) {
    const {
      handleClose,
      panelClass,
      user,
      notice,
      isBanned,
      quota,
      quotaLoading,
      pointsLeft,
      pct,
      isUnlimited,
      quotaLimitInput,
      setQuotaLimitInput,
      setIsUnlimited,
      quotaNote,
      setQuotaNote,
      handleSaveQuota,
      savingQuota,
      handleClearQuota,
      showNotice,
      toPoints,
      setGrantModalOpen,
      handleClearFlag,
      clearingFlag,
      handleUnban,
      banning,
      banDuration,
      setBanDuration,
      banReason,
      setBanReason,
      handleBan,
      deleteConfirmEmail,
      setDeleteConfirmEmail,
      deleting,
      handleDeleteUser,
      grantModalOpen,
      setQuota,
      onReloadList,
    } = props
    return (
      <>
        <AdminDrawer
          onClose={handleClose}
          className={cn(
            'border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l shadow-2xl sm:w-[480px]',
            panelClass,
          )}
          aria-label={translate('adminPagesCopy.m79')}
        >
          <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatarWithPresence user={user} className="size-10 text-[15px]" />
              <div className="min-w-0">
                <h2 className="text-ink truncate text-[16px] font-bold">
                  {user.name || translate('adminPagesCopy.m59')}
                </h2>
                <p className="text-ink-3 truncate text-[12.5px]">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-ink-3 hover:bg-sunken hover:text-ink shrink-0 rounded-[6px] p-1.5"
              aria-label={translate('adminPagesCopy.m80')}
            >
              <X className="size-5" />
            </button>
          </div>

          {notice ? (
            <div className="bg-sage-soft text-sage flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium sm:px-6">
              <Check className="size-4 shrink-0" />
              <span>{notice}</span>
            </div>
          ) : null}

          <div className="flex-1 space-y-6 overflow-y-auto p-4 text-[13.5px] sm:p-6">
            <section className="space-y-3">
              <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
                {translate('adminPagesCopy.m81')}
              </h3>
              <div className="border-line-2 bg-sunken/40 grid grid-cols-2 gap-3 rounded-[8px] border p-4">
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m82')}
                  </span>
                  <span className="text-ink-2 font-mono text-[11.5px]" data-tip={user.id}>
                    {shortenId(user.id)}
                    {translate('adminPagesCopy.m83')}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m65')}
                  </span>
                  <span className="text-ink font-medium">
                    {user.role === 'admin'
                      ? translate('adminPagesCopy.m84')
                      : user.role === 'moderator'
                        ? translate('adminPagesCopy.m85')
                        : translate('adminPagesCopy.m59')}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m60')}
                  </span>
                  <span className="text-ink font-medium">{formatViDateTime(user.createdAt)}</span>
                </div>
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m61')}
                  </span>
                  <span className="text-ink font-medium">
                    {user.lastSignInAt
                      ? formatViDateTime(user.lastSignInAt)
                      : translate('adminPagesCopy.m73')}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m86')}
                  </span>
                  <span className="tnum text-ink font-medium">
                    {user.docs}
                    {translate('adminPagesCopy.m87')}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m88')}
                  </span>
                  <span className="tnum text-ink font-medium">
                    {user.decks}
                    {translate('adminPagesCopy.m89')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-3 block text-[12px]">
                    {translate('adminPagesCopy.m64')}
                  </span>
                  <div className="mt-1">
                    {isBanned ? (
                      <Badge tone="clay">
                        {translate('adminPagesCopy.m90')}
                        {formatViDateTime(user.bannedUntil)}
                      </Badge>
                    ) : (
                      <Badge tone="sage">{translate('adminPagesCopy.m75')}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
                  {translate('adminPagesCopy.m91')}
                </h3>
                {quota?.override ? (
                  <Badge tone="honey">{translate('adminPagesCopy.m92')}</Badge>
                ) : null}
              </div>

              {quotaLoading ? (
                <LoadingRegion><FormSkeleton /></LoadingRegion>
              ) : (
                <div className="border-line-2 bg-sunken/40 space-y-4 rounded-[8px] border p-4">
                  <div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-2">{translate('adminPagesCopy.m94')}</span>
                      <span className="tnum text-ink font-semibold">
                        {pointsLeft === null
                          ? translate('adminPagesCopy.m95')
                          : translate('adminPagesCopy.m96', {
                              value0: String(formatNumber(pointsLeft)),
                            })}
                      </span>
                    </div>
                    <div className="bg-sunken mt-2 h-2.5 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pointsLeft !== null && pointsLeft < 20 ? 'bg-clay' : 'bg-sage'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {quota?.emptyDay !== null && quota?.emptyDay !== undefined && (
                      <div className="mt-2 flex items-center justify-between text-[13px]">
                        <span className="text-ink-2">{translate('adminPagesCopy.m97')}</span>
                        <span
                          className={cn(
                            'tnum font-semibold',
                            quota.freeEmpty !== null &&
                              quota.freeEmpty !== undefined &&
                              quota.emptyDay >= quota.freeEmpty
                              ? 'text-clay'
                              : 'text-ink',
                          )}
                        >
                          {quota.emptyDay}
                          {quota.freeEmpty === null || quota.freeEmpty === undefined
                            ? ''
                            : ` / ${quota.freeEmpty}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-line-2 space-y-3 border-t pt-3">
                    <div>
                      <label className="text-ink-2 mb-1 block text-[12.5px] font-medium">
                        {translate('adminPagesCopy.m98')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="number"
                          disabled={isUnlimited}
                          value={isUnlimited ? '' : quotaLimitInput}
                          onChange={(e) => setQuotaLimitInput(e.target.value)}
                          placeholder={
                            isUnlimited
                              ? translate('adminPagesCopy.m95')
                              : translate('adminPagesCopy.m99')
                          }
                          className={`${inputClass} min-w-0 flex-1 text-[13.5px]`}
                        />
                        <Button
                          type="button"
                          variant={isUnlimited ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setIsUnlimited(!isUnlimited)}
                          className="shrink-0"
                        >
                          {translate('adminPagesCopy.m95')}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-ink-2 mb-1 block text-[12.5px] font-medium">
                        {translate('adminPagesCopy.m100')}
                      </label>
                      <input
                        type="text"
                        value={quotaNote}
                        onChange={(e) => setQuotaNote(e.target.value)}
                        placeholder={translate('adminPagesCopy.m101')}
                        className={`${inputClass} text-[13.5px]`}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveQuota}
                        disabled={savingQuota}
                      >
                        {savingQuota
                          ? translate('adminPagesCopy.m102')
                          : translate('adminPagesCopy.m103')}
                      </Button>
                      {quota?.override ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearQuota}
                          disabled={savingQuota}
                        >
                          {translate('adminPagesCopy.m104')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <StorageSection userId={user.id} onSaved={showNotice} />

            <section className="space-y-3">
              <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
                {translate('adminPagesCopy.m105')}
              </h3>
              <div className="border-line-2 bg-sunken/40 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border p-3.5 sm:p-4">
                <div>
                  <span className="text-ink-3 block text-[12.5px]">
                    {translate('adminPagesCopy.m106')}
                  </span>
                  <span className="tnum font-display text-ink text-[22px] font-bold">
                    {formatNumber(toPoints(quota?.credits ?? 0))}
                    <span className="text-ink-3 text-[13px] font-normal">
                      {translate('adminPagesCopy.m107')}
                    </span>
                  </span>
                  {quota?.welcomePending && (
                    <span className="text-ink-3 mt-0.5 block text-[12px]">
                      {translate('adminPagesCopy.m108')}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setGrantModalOpen(true)}>
                  <Coins className="size-4" />
                  <span>{translate('adminPagesCopy.m109')}</span>
                </Button>
              </div>
            </section>

            {user.flag ? (
              <section className="space-y-3">
                <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
                  {translate('adminPagesCopy.m110')}
                </h3>
                <div className="border-honey/40 bg-honey-soft text-ink-2 space-y-2 rounded-[8px] border p-4 text-[13px]">
                  <p className="text-ink flex items-start gap-2 font-semibold">
                    <ShieldAlert className="text-honey mt-0.5 size-4 shrink-0" />
                    {translate('adminPagesCopy.m111')}
                    {user.flag.strikes}
                    {translate('adminPagesCopy.m112')}
                  </p>
                  <p>
                    {translate('adminPagesCopy.m113')}
                    {formatViDateTime(user.flag.lastAt)}
                    {user.flag.lastAction
                      ? translate('adminPagesCopy.m114', { value0: String(user.flag.lastAction) })
                      : ''}
                    {user.flag.lastIp ? ` · IP ${user.flag.lastIp}` : ''}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFlag}
                    disabled={clearingFlag}
                  >
                    {clearingFlag
                      ? translate('adminPagesCopy.m115')
                      : translate('adminPagesCopy.m34')}
                  </Button>
                </div>
              </section>
            ) : null}

            {user.role === 'admin' ? null : (
              <section className="space-y-3">
                <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
                  {translate('adminPagesCopy.m30')}
                </h3>
                <div className="border-line-2 bg-sunken/40 space-y-3 rounded-[8px] border p-3.5 sm:p-4">
                  {isBanned ? (
                    <div className="space-y-3">
                      <div className="text-clay flex items-center gap-2 text-[13px]">
                        <Lock className="size-4" />
                        <span>
                          {translate('adminPagesCopy.m116')}
                          <strong>{formatViDateTime(user.bannedUntil)}</strong>
                        </span>
                      </div>
                      <Button variant="soft" size="sm" onClick={handleUnban} disabled={banning}>
                        <Unlock className="size-4" />
                        <span>
                          {banning
                            ? translate('adminPagesCopy.m117')
                            : translate('adminPagesCopy.m39')}
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="text-ink-2 mb-1.5 block text-[12.5px] font-medium">
                          {translate('adminPagesCopy.m118')}
                        </span>
                        <Segmented
                          value={banDuration}
                          options={[...BAN_DURATIONS]}
                          onChange={(v) => setBanDuration(v as typeof banDuration)}
                          label={translate('adminPagesCopy.m118')}
                          className="w-full [&>button]:flex-auto [&>button]:justify-center [&>button]:px-2 [&>button]:text-[12.5px] sm:[&>button]:px-3.5 sm:[&>button]:text-[13.5px]"
                        />
                      </div>
                      <div>
                        <label className="text-ink-2 mb-1 block text-[12.5px] font-medium">
                          {translate('adminPagesCopy.m119')}
                        </label>
                        <input
                          type="text"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder={translate('adminPagesCopy.m120')}
                          className={`${inputClass} text-[13.5px]`}
                        />
                      </div>
                      <Button variant="clay" size="sm" onClick={handleBan} disabled={banning}>
                        <Ban className="size-4" />
                        <span>
                          {banning
                            ? translate('adminPagesCopy.m121')
                            : translate('adminPagesCopy.m30')}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {user.role === 'admin' ? null : (
              <section className="space-y-3 pt-2">
                <div className="border-clay/30 bg-clay-soft/40 rounded-[8px] border p-4">
                  <div className="text-clay flex items-center gap-2 font-bold">
                    <TrashIcon className="size-4.5" />
                    <span>{translate('adminPagesCopy.m122')}</span>
                  </div>
                  <p className="text-ink-2 mt-2 text-[12.5px] leading-relaxed">
                    {translate('adminPagesCopy.m123')}
                  </p>

                  <div className="mt-3">
                    <label className="text-ink-2 mb-1 block text-[12px] font-medium">
                      {translate('adminPagesCopy.m124')}
                      <strong className="text-ink">{user.email}</strong>
                      {translate('adminPagesCopy.m125')}
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder={user.email}
                      className={`${inputClass} text-[13px]`}
                    />
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="clay"
                      size="sm"
                      disabled={
                        deleteConfirmEmail.trim().toLowerCase() !==
                          user.email.trim().toLowerCase() || deleting
                      }
                      onClick={handleDeleteUser}
                    >
                      <TrashIcon className="size-4" />
                      <span>
                        {deleting
                          ? translate('adminPagesCopy.m126')
                          : translate('adminPagesCopy.m127')}
                      </span>
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </AdminDrawer>

        {grantModalOpen ? (
          <GrantCreditsModal
            user={user}
            currentCredits={quota?.credits ?? 0}
            onClose={() => setGrantModalOpen(false)}
            onSuccess={async (newBalance) => {
              if (quota) setQuota({ ...quota, credits: newBalance })
              showNotice(
                translate('adminPagesCopy.m128', {
                  value0: String(formatNumber(Math.floor(newBalance / TOKENS_PER_POINT))),
                }),
              )
              await onReloadList()
            }}
          />
        ) : null}
      </>
    )
  }
  return null
}
export function UsersPanelGrantCreditsModalUi(
  props: ReturnType<typeof UsersPanelModel.useGrantCreditsModalContainer> & {
    parts: typeof Imported2
  },
) {
  if (props.viewState === 0) {
    const {
      onClose,
      user,
      pts,
      currentCredits,
      pointsInput,
      setPointsInput,
      note,
      setNote,
      resultBalance,
      submitting,
      isValid,
      handleGrant,
    } = props
    return (
      <AdminModal
        title={translate('adminPagesCopy.m105')}
        onClose={onClose}
        className="max-w-[calc(100vw-2rem)] p-4 sm:max-w-lg sm:p-6"
      >
        <div className="border-line flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Coins className="text-clay size-5" />
            <h3 className="text-ink text-[17px] font-bold">{translate('adminPagesCopy.m105')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-4 hover:bg-sunken hover:text-ink rounded-[6px] p-1"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-[13.5px]">
          <p className="text-ink-2">
            {translate('adminPagesCopy.m129')}
            <strong>{user.email}</strong>
          </p>

          <div className="bg-sunken/60 rounded-[6px] p-3 text-[13px]">
            <span className="text-ink-3">{translate('adminPagesCopy.m130')}</span>
            <strong className="text-ink">
              {pts(currentCredits)}
              {translate('adminPagesCopy.m107')}
            </strong>
          </div>

          <div>
            <label className="text-ink-2 mb-1 block text-[13px] font-medium">
              {translate('adminPagesCopy.m131')}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder={translate('adminPagesCopy.m132')}
              className={`${inputClass} text-[13.5px]`}
              autoFocus
            />
          </div>

          <div>
            <label className="text-ink-2 mb-1 block text-[13px] font-medium">
              {translate('adminPagesCopy.m100')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={translate('adminPagesCopy.m133')}
              className={`${inputClass} text-[13.5px]`}
            />
          </div>

          {resultBalance === null ? null : (
            <div className="bg-sage-soft text-sage flex items-center gap-2 rounded-[6px] p-3 text-[13px] font-medium">
              <Check className="size-4 shrink-0" />
              <span>
                {translate('adminPagesCopy.m134')}
                {pts(resultBalance)}
                {translate('adminPagesCopy.m135')}
              </span>
            </div>
          )}
        </div>

        <div className="border-line flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {resultBalance === null
              ? translate('adminPagesCopy.m137')
              : translate('adminPagesCopy.m136')}
          </Button>
          {resultBalance === null ? (
            <Button
              variant="primary"
              size="sm"
              disabled={!isValid || submitting}
              onClick={handleGrant}
            >
              {submitting ? translate('adminPagesCopy.m138') : translate('adminPagesCopy.m109')}
            </Button>
          ) : null}
        </div>
      </AdminModal>
    )
  }
  return null
}
export function UsersPanelUserAvatarUi(
  props: ReturnType<typeof UsersPanelModel.useUserAvatarContainer> & {
    parts: typeof Imported3
  },
) {
  if (props.viewState === 0) {
    const { user, className } = props
    return (
      <Avatar
        src={user.avatar}
        name={user.name || user.email}
        className={className}
        fallbackClassName="bg-clay/10 text-clay"
      />
    )
  }
  return null
}
export function UsersPanelUserAvatarWithPresenceUi(
  props: ReturnType<typeof UsersPanelModel.useUserAvatarWithPresenceContainer> & {
    parts: typeof Imported4
  },
) {
  const { UserAvatar } = props.parts
  if (props.viewState === 0) {
    const { user, className } = props
    return (
      <span className="relative inline-flex shrink-0">
        <UserAvatar user={user} className={className} />
        {user.online && (
          <span
            className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
            data-tip={translate('adminPagesCopy.m139')}
            role="img"
            aria-label={translate('adminPagesCopy.m139')}
          />
        )}
      </span>
    )
  }
  return null
}
export function UsersPanelStorageSectionUi(
  props: ReturnType<typeof UsersPanelModel.useStorageSectionContainer> & {
    parts: typeof Imported5
  },
) {
  if (props.viewState === 0) {
    const { data, max, pct, mb, setMb, note, setNote, onSave, saving, save } = props
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-ink-3 text-[12px] font-bold tracking-wider uppercase">
            {translate('adminPagesCopy.m140')}
          </h3>
          {data?.override ? <Badge tone="honey">{translate('adminPagesCopy.m92')}</Badge> : null}
        </div>
        {data ? (
          <div className="border-line-2 bg-sunken/40 space-y-4 rounded-[8px] border p-4">
            <div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-2">{translate('adminPagesCopy.m142')}</span>
                <span className="tnum text-ink font-semibold">
                  {data.used === null || data.used === undefined
                    ? '—'
                    : (data.used / MB).toFixed(1)}
                  {translate('adminPagesCopy.m143')}
                  {(max / MB).toFixed(0)}
                  {translate('adminPagesCopy.m144')}
                </span>
              </div>
              <div className="bg-sunken mt-2 h-2.5 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-clay' : 'bg-sage'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="border-line-2 space-y-3 border-t pt-3">
              <div>
                <label className="text-ink-2 mb-1 block text-[12.5px] font-medium">
                  {translate('adminPagesCopy.m145')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={1024}
                  value={mb}
                  onChange={(e) => setMb(e.target.value)}
                  className={`${inputClass} text-[13.5px]`}
                />
              </div>
              <div>
                <label className="text-ink-2 mb-1 block text-[12.5px] font-medium">
                  {translate('adminPagesCopy.m100')}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={translate('adminPagesCopy.m146')}
                  className={`${inputClass} text-[13.5px]`}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
                  {saving ? translate('adminPagesCopy.m102') : translate('adminPagesCopy.m103')}
                </Button>
                {data.override ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void save(null)}
                    disabled={saving}
                  >
                    {translate('adminPagesCopy.m104')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <LoadingRegion><FormSkeleton /></LoadingRegion>
        )}
      </section>
    )
  }
  return null
}
