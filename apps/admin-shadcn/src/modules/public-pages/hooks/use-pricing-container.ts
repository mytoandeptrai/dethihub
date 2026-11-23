'use client'

import {
  DEFAULT_PACK_VND,
  MAX_POINTS,
  MAX_VND,
  MIN_VND,
  PACKS,
  basePoints,
  clampVnd,
  packPoints,
  usesFor,
  vndFor,
} from '@engine-pricing'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { billingKeys } from '@/apis/billing/keys'
import { billingFirstBonusQuery, billingGetOrderQuery } from '@/apis/billing/queries'
import { billingCreateOrder } from '@/apis/billing/requests'
import { appPaths } from '@/config/app-paths'
import { useSession } from '@/hooks'
import { t } from '@/i18n/translate'

import { useProductPricing } from './use-product-pricing'

import type { components } from '@workspace/api-types'
import type { ChangeEvent } from 'react'

export type PaymentOrder = components['schemas']['CreatedOrderResponseDto']
const fmt = (value: number) => value.toLocaleString('vi-VN')

export function usePricingContainer() {
  const pricing = useProductPricing()
  const { session } = useSession()
  const router = useRouter()
  const search = useSearchParams()
  const returningOrder = Number(search.get('order'))
  const client = useQueryClient()
  const bonus = useQuery({ ...billingFirstBonusQuery({}), enabled: !!session })
  const returning = useQuery({
    ...billingGetOrderQuery({ params: { path: { orderCode: returningOrder } } }),
    enabled:
      !!session &&
      Number.isSafeInteger(returningOrder) &&
      returningOrder > 0 &&
      search.get('huy') !== '1',
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && query.state.dataUpdateCount < 8 ? 3000 : false,
  })
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedPackVnd, setSelectedPackVnd] = useState<number | null>(DEFAULT_PACK_VND)
  const [mode, setMode] = useState<'vnd' | 'points'>('vnd')
  const [rawInput, setRawInput] = useState(fmt(DEFAULT_PACK_VND))
  const [inputError, setInputError] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null)
  const boughtSet = new Set(bonus.data?.bonused ?? [])
  const packs = PACKS.map((pack) => ({
    vnd: pack.vnd,
    bonus: pack.bonus,
    firstTime: !boughtSet.has(pack.vnd),
    points: packPoints(pack, !boughtSet.has(pack.vnd)),
  }))
  const selected = packs.find((pack) => pack.vnd === selectedPackVnd)
  const parsed = Number(rawInput.replaceAll(/\D/g, ''))
  const vnd = selected?.vnd ?? (mode === 'vnd' ? clampVnd(parsed) : vndFor(parsed))
  const summary = {
    vnd,
    points: selected?.points ?? basePoints(vnd),
    pack: selected ?? null,
    firstTime: selected?.firstTime ?? false,
  }
  const create = useMutation({
    mutationFn: (amount: number) => billingCreateOrder({ body: { vnd: amount } }),
    onSuccess: setCheckout,
    onError: (error) => toast.error(error.message),
  })
  useEffect(() => {
    if (!pricing.data) return
    setSelectedPackVnd(pricing.data.defaultVnd)
    setRawInput(fmt(pricing.data.defaultVnd))
  }, [pricing.data])
  const selectPack = (pack: { vnd: number }) => {
    setSelectedPackVnd(pack.vnd)
    setRawInput(
      fmt(mode === 'vnd' ? pack.vnd : (packs.find((item) => item.vnd === pack.vnd)?.points ?? 0)),
    )
    setInputError(null)
  }
  const handleModeChange = (value: 'vnd' | 'points') => {
    setMode(value)
    setRawInput(fmt(value === 'vnd' ? summary.vnd : summary.points))
    setInputError(null)
  }
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value.replaceAll(/\D/g, ''))
    setRawInput(value ? fmt(value) : '')
    setSelectedPackVnd(null)
    const invalid =
      mode === 'vnd' ? value < MIN_VND || value > MAX_VND : value < 1 || value > MAX_POINTS
    setInputError(
      invalid ? t('product.invalidAmount', { min: fmt(MIN_VND), max: fmt(MAX_VND) }) : null,
    )
  }
  const handleInputBlur = () => {
    setRawInput(fmt(mode === 'vnd' ? summary.vnd : Math.min(MAX_POINTS, Math.max(1, parsed))))
    setInputError(null)
  }
  const handlePayClick = () => {
    if (!session) {
      router.push(appPaths.auth.login.getHref(appPaths.pricing.href))
      return
    }
    create.mutate(summary.vnd)
  }
  const onPaid = (points: number) => {
    setCheckout(null)
    void client.invalidateQueries({ queryKey: billingKeys.all })
    toast.success(t('product.paid', { points: fmt(points) }))
  }
  useEffect(() => {
    if (returning.data && returning.data.status !== 'pending') {
      if (returning.data.status === 'paid') {
        void client.invalidateQueries({ queryKey: billingKeys.all })
        toast.success(t('product.paid', { points: fmt(returning.data.points) }))
      }
      router.replace(appPaths.pricing.href)
    }
  }, [returning.data, client, router])
  return {
    session,
    pricingError: pricing.error?.message ?? bonus.error?.message ?? returning.error?.message,
    inputId,
    inputRef,
    rawInput,
    inputError,
    paying: create.isPending,
    checkout,
    boughtSet,
    selectedPackVnd,
    mode,
    summary,
    estimatedUses: usesFor(summary.points),
    selectPack,
    handleModeChange,
    handleInputChange,
    handleInputBlur,
    handlePayClick,
    closeCheckout: () => setCheckout(null),
    onPaid,
    PACKS: packs,
  }
}
