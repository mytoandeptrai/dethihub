'use client'

import { ForgotPasswordFormUi } from '@/modules/auth/forgot-password/components'
import { useForgotPasswordContainer } from '@/modules/auth/forgot-password/hooks'

const ForgotPasswordContainer = () => {
  const props = useForgotPasswordContainer()
  return <ForgotPasswordFormUi {...props} />
}
export default ForgotPasswordContainer
