'use client'
import CheckoutUi from '@/modules/public-pages/components/checkout-ui'
import { useCheckoutContainer } from '@/modules/public-pages/hooks'

import type { CheckoutProps } from '@/modules/public-pages/hooks'
export default function CheckoutContainer(props: CheckoutProps) {
  const state = useCheckoutContainer(props)
  return <CheckoutUi {...state} />
}
