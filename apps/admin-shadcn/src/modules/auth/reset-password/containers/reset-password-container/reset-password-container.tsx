'use client'

import { ResetPasswordFormUi } from '@/modules/auth/reset-password/components'
import { useResetPasswordContainer } from '@/modules/auth/reset-password/hooks'

const ResetPasswordContainer = () => {
  const props = useResetPasswordContainer()
  return <ResetPasswordFormUi {...props} />
}
export default ResetPasswordContainer
