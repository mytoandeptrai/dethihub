'use client'

import { FoundationUi } from '@/modules/foundation/components'
import { useFoundationContainer } from '@/modules/foundation/hooks'

import type { FoundationMode } from '@/modules/foundation/hooks'

const FoundationContainer = ({ mode }: { mode: FoundationMode }) => {
  const props = useFoundationContainer(mode)
  return <FoundationUi {...props} />
}
export default FoundationContainer
