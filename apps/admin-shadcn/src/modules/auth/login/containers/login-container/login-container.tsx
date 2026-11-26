'use client'

import { LoginFormUi } from '@/modules/auth/login/components'
import { useLoginContainer } from '@/modules/auth/login/hooks'

const LoginContainer = () => {
  const props = useLoginContainer()
  return <LoginFormUi {...props} />
}
export default LoginContainer
