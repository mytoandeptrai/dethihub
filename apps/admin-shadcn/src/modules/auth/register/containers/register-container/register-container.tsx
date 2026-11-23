'use client'

import { RegisterFormUi } from '@/modules/auth/register/components'
import { useRegisterContainer } from '@/modules/auth/register/hooks'

const RegisterContainer = () => {
  const props = useRegisterContainer()
  return <RegisterFormUi {...props} />
}
export default RegisterContainer
