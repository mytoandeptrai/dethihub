'use client'

import { EditorUI } from '@/modules/editor/components'
import { useEditorContainer } from '@/modules/editor/hooks'

export function EditorContainer() {
  const props = useEditorContainer()
  return <EditorUI {...props} />
}
