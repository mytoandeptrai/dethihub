'use client'

import { WorkspaceUi } from '@/modules/shell/components'
import { useWorkspaceContainer } from '@/modules/shell/hooks'

export default function WorkspaceContainer() {
  const state = useWorkspaceContainer()
  return <WorkspaceUi {...state} />
}
