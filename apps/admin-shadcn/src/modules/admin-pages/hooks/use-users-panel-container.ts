'use client'
import {
  lib_adminApi_AdminError as AdminError,
  lib_llm_TOKENS_PER_POINT as TOKENS_PER_POINT,
} from '@admin-pages-engine'
import { dialog } from '@engine-dialogs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { t as translate } from '@/i18n/translate'
import { creditSchema, quotaSchema, storageSchema } from '@/modules/admin-pages/hooks/admin-schemas'
import { formatNumber } from '@/modules/admin-pages/hooks/admin-utils'
import { useAdminRequests } from '@/modules/admin-pages/hooks/use-admin-requests'
import { useDrawerExit } from '@/modules/admin-pages/hooks/use-drawer-exit'

import type {
  lib_adminApi_AdminMe as AdminMe,
  lib_adminApi_AdminUser as AdminUser,
  lib_adminApi_UserQuota as UserQuota,
  lib_adminApi_UserStorage as UserStorage,
} from '@admin-pages-engine'
export interface UsersPanelProps {
  me?: AdminMe
}
export interface UserDetailDrawerProps {
  user: AdminUser
  onClose: () => void
  onReloadList: () => Promise<void>
  onDeleted: (id: string) => void
  onUserUpdated: (u: AdminUser) => void
}
export const BAN_DURATIONS = [
  { key: '24', label: translate('adminPagesCopy.m14') },
  { key: '168', label: translate('adminPagesCopy.m15') },
  { key: '720', label: translate('adminPagesCopy.m16') },
  { key: 'inf', label: translate('adminPagesCopy.m17') },
] as const
export const MB = 1024 * 1024
export function useUsersPanelContainer({ me: _me }: UsersPanelProps) {
  const { listUsers } = useAdminRequests()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const perPage = 20
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listUsers({
        q: debouncedSearch.trim() || undefined,
        page,
        perPage,
      })
      setUsers(res.users)
      setTotal(res.total)
      if (selectedUser) {
        const updated = res.users.find((u) => u.id === selectedUser.id)
        if (updated) setSelectedUser(updated)
      }
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m18'), error)
      const msg = error instanceof Error ? error.message : translate('adminPagesCopy.m19')
      void dialog.alert(msg, { title: translate('adminPagesCopy.m20') })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, selectedUser, listUsers])
  useEffect(() => {
    void loadUsers()
  }, [debouncedSearch, page, loadUsers])
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    viewState: 0 as const,
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
  }
}
export function useUserDetailDrawerContainer({
  user,
  onClose,
  onReloadList,
  onDeleted,
  onUserUpdated,
}: UserDetailDrawerProps) {
  const {
    banUser,
    clearQuota,
    clearSecurityFlag,
    deleteUser,
    getQuota,
    setQuota: saveQuota,
    unbanUser,
  } = useAdminRequests()
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)
  const [quotaLimitInput, setQuotaLimitInput] = useState('')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [quotaNote, setQuotaNote] = useState('')
  const [savingQuota, setSavingQuota] = useState(false)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [banDuration, setBanDuration] = useState<'24' | '168' | '720' | 'inf'>('24')
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }
  const { close: handleClose, panelClass } = useDrawerExit(onClose)
  const loadQuotaData = useCallback(async () => {
    setQuotaLoading(true)
    try {
      const q = await getQuota(user.id)
      setQuota(q)
      if (q.override) {
        if (q.override.monthlyTokens === null) {
          setIsUnlimited(true)
          setQuotaLimitInput('')
        } else {
          setIsUnlimited(false)
          setQuotaLimitInput(String(q.override.monthlyTokens / TOKENS_PER_POINT))
        }
        setQuotaNote(q.override.note || '')
      } else {
        setIsUnlimited(false)
        setQuotaLimitInput(String(q.defaultLimit / TOKENS_PER_POINT))
        setQuotaNote('')
      }
    } catch (error: unknown) {
      console.error(translate('adminPagesCopy.m21'), error)
    } finally {
      setQuotaLoading(false)
    }
  }, [user.id, getQuota])
  useEffect(() => {
    void loadQuotaData()
    setDeleteConfirmEmail('')
    setBanReason('')
  }, [loadQuotaData])
  const quotaForm = useForm({
    resolver: zodResolver(quotaSchema),
    values: { limit: isUnlimited ? null : Number(quotaLimitInput) },
  })
  const handleSaveQuota = async () => {
    if (!(await quotaForm.trigger())) return void dialog.alert(translate('adminPagesCopy.m22'))
    setSavingQuota(true)
    try {
      const points = Number(quotaLimitInput)
      if (!isUnlimited && (quotaLimitInput.trim() === '' || isNaN(points) || points < 0)) {
        await dialog.alert(translate('adminPagesCopy.m22'))
        return
      }
      const monthlyTokens = isUnlimited ? null : Math.round(points * TOKENS_PER_POINT)
      await saveQuota(user.id, monthlyTokens, quotaNote.trim())
      showNotice(translate('adminPagesCopy.m23'))
      await loadQuotaData()
      await onReloadList()
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m24')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setSavingQuota(false)
    }
  }
  const handleClearQuota = async () => {
    setSavingQuota(true)
    try {
      await clearQuota(user.id)
      showNotice(translate('adminPagesCopy.m26'))
      await loadQuotaData()
      await onReloadList()
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m27')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setSavingQuota(false)
    }
  }
  const isBanned = Boolean(user.bannedUntil && new Date(user.bannedUntil) > new Date())
  const handleBan = async () => {
    const durationLabel = BAN_DURATIONS.find((d) => d.key === banDuration)?.label ?? ''
    const confirmed = await dialog.confirm(
      translate('adminPagesCopy.m28', {
        value0: String(user.email),
        value1: String(durationLabel),
      }),
      {
        title: translate('adminPagesCopy.m29'),
        danger: true,
        confirmLabel: translate('adminPagesCopy.m30'),
      },
    )
    if (!confirmed) return
    setBanning(true)
    try {
      const hours =
        banDuration === '24'
          ? 24
          : banDuration === '168'
            ? 168
            : banDuration === '720'
              ? 720
              : undefined
      await banUser(user.id, { reason: banReason.trim(), hours })
      showNotice(translate('adminPagesCopy.m31'))
      const newBannedUntil = new Date(
        Date.now() + (hours ? hours * 3600e3 : 100 * 365 * 864e5),
      ).toISOString()
      onUserUpdated({ ...user, bannedUntil: newBannedUntil })
      await onReloadList()
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m32')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setBanning(false)
    }
  }
  const [clearingFlag, setClearingFlag] = useState(false)
  const handleClearFlag = async () => {
    const ok = await dialog.confirm(translate('adminPagesCopy.m33'), {
      title: translate('adminPagesCopy.m34'),
      confirmLabel: translate('adminPagesCopy.m35'),
    })
    if (!ok) return
    setClearingFlag(true)
    try {
      await clearSecurityFlag(user.id)
      onUserUpdated({ ...user, flag: null })
      showNotice(translate('adminPagesCopy.m36'))
      await onReloadList()
    } catch (error: unknown) {
      await dialog.alert(error instanceof Error ? error.message : translate('adminPagesCopy.m37'), {
        title: translate('adminPagesCopy.m25'),
      })
    } finally {
      setClearingFlag(false)
    }
  }
  const handleUnban = async () => {
    const confirmed = await dialog.confirm(
      translate('adminPagesCopy.m38', { value0: String(user.email) }),
      {
        title: translate('adminPagesCopy.m39'),
        confirmLabel: translate('adminPagesCopy.m40'),
      },
    )
    if (!confirmed) return
    setBanning(true)
    try {
      await unbanUser(user.id)
      showNotice(translate('adminPagesCopy.m41'))
      onUserUpdated({ ...user, bannedUntil: null })
      await onReloadList()
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m42')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setBanning(false)
    }
  }
  const handleDeleteUser = async () => {
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return
    }
    const confirmed = await dialog.confirm(
      translate('adminPagesCopy.m43', { value0: String(user.email) }),
      {
        title: translate('adminPagesCopy.m44'),
        danger: true,
        confirmLabel: translate('adminPagesCopy.m45'),
      },
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteUser(user.id, deleteConfirmEmail)
      onDeleted(user.id)
      void dialog.alert(translate('adminPagesCopy.m46', { value0: String(user.email) }), {
        title: translate('adminPagesCopy.m47'),
      })
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m48')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setDeleting(false)
    }
  }
  const limitValue = quota?.override ? quota.override.monthlyTokens : (quota?.defaultLimit ?? 0)
  const usedValue = quota?.usedThisMonth ?? user.tokensThisMonth
  const creditsValue = quota?.credits ?? 0
  const toPoints = (tokens: number) => Math.floor(tokens / TOKENS_PER_POINT)
  const pointsLeft =
    limitValue === null ? null : Math.max(0, toPoints(limitValue + creditsValue - usedValue))
  const pct =
    pointsLeft === null
      ? 100
      : Math.min(100, Math.round((pointsLeft / Math.max(120, pointsLeft)) * 100))
  return {
    viewState: 0 as const,
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
  }
}
export function useGrantCreditsModalContainer({
  user,
  currentCredits,
  onClose,
  onSuccess,
}: {
  user: AdminUser
  currentCredits: number
  onClose: () => void
  onSuccess: (newBalance: number) => Promise<void>
}) {
  const { grantCredits } = useAdminRequests()
  const [pointsInput, setPointsInput] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultBalance, setResultBalance] = useState<number | null>(null)
  const numPoints = Number(pointsInput)
  const isValid = Number.isInteger(numPoints) && numPoints > 0 && numPoints <= 100_000
  const numTokens = numPoints * TOKENS_PER_POINT
  const pts = (tokens: number) => formatNumber(Math.floor(tokens / TOKENS_PER_POINT))
  const creditForm = useForm({
    resolver: zodResolver(creditSchema),
    values: { points: numPoints, note },
  })
  const handleGrant = async () => {
    if (!(await creditForm.trigger())) return
    if (!isValid) return
    setSubmitting(true)
    try {
      const res = await grantCredits(user.id, numTokens, note.trim())
      setResultBalance(res.balance)
      await onSuccess(res.balance)
    } catch (error: unknown) {
      const msg =
        error instanceof AdminError || error instanceof Error
          ? error.message
          : translate('adminPagesCopy.m49')
      await dialog.alert(msg, { title: translate('adminPagesCopy.m25') })
    } finally {
      setSubmitting(false)
    }
  }
  return {
    viewState: 0 as const,
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
  }
}
export function useUserAvatarContainer({
  user,
  className,
}: {
  user: AdminUser
  className?: string
}) {
  return { viewState: 0 as const, user, className }
}
export function useUserAvatarWithPresenceContainer({
  user,
  className,
}: {
  user: AdminUser
  className?: string
}) {
  return { viewState: 0 as const, user, className }
}
export function useStorageSectionContainer({
  userId,
  onSaved,
}: {
  userId: string
  onSaved: (msg: string) => void
}) {
  const { getStorage, setStorage } = useAdminRequests()
  const [data, setData] = useState<UserStorage | null>(null)
  const [mb, setMb] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    try {
      const d = await getStorage(userId)
      setData(d)
      setMb(String(Math.round((d.override?.maxBytes ?? d.defaultBytes) / MB)))
      setNote(d.override?.note ?? '')
    } catch (error) {
      console.error(translate('adminPagesCopy.m50'), error)
    }
  }, [userId, getStorage])
  useEffect(() => {
    setData(null)
    void load()
  }, [load])
  const save = async (maxBytes: number | null) => {
    setSaving(true)
    try {
      await setStorage(userId, maxBytes, note.trim())
      onSaved(maxBytes === null ? translate('adminPagesCopy.m51') : translate('adminPagesCopy.m52'))
      await load()
    } catch (error: unknown) {
      await dialog.alert(error instanceof Error ? error.message : translate('adminPagesCopy.m53'), {
        title: translate('adminPagesCopy.m25'),
      })
    } finally {
      setSaving(false)
    }
  }
  const storageForm = useForm({ resolver: zodResolver(storageSchema), values: { mb: Number(mb) } })
  const onSave = async () => {
    if (!(await storageForm.trigger())) return void dialog.alert(translate('adminPagesCopy.m54'))
    const n = Number(mb)
    if (!Number.isFinite(n) || n < 1 || n > 1024)
      return void dialog.alert(translate('adminPagesCopy.m54'))
    void save(Math.round(n * MB))
  }
  const max = data ? (data.override?.maxBytes ?? data.defaultBytes) : 0
  const pct =
    data?.used !== null && data?.used !== undefined && max
      ? Math.min(100, Math.round((data.used / max) * 100))
      : 0
  return { viewState: 0 as const, data, max, pct, mb, setMb, note, setNote, onSave, saving, save }
}
